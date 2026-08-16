package com.prepedge.controller;

import com.prepedge.entity.AssessmentLink;
import com.prepedge.repository.AssessmentLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Public-facing assessment controller.
 * Students use slug + password — NO JWT required.
 * Secured at app level (permit in SecurityConfig).
 *
 * Scalability design:
 * - Stateless: no server session, password verified per request
 * - JOIN FETCH query loads test + questions + options in 1 SQL call
 * - HikariCP handles connection pooling automatically
 * - DB indexes on slug column ensure O(log n) lookup even at scale
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AssessmentController {

    private final AssessmentLinkRepository assessmentLinkRepository;

    /**
     * Public info — no password needed.
     * Returns title, duration and question count so the access page
     * can show "You are joining: [Assessment Name]" before password entry.
     */
    @GetMapping("/{slug}/info")
    public ResponseEntity<?> getInfo(@PathVariable String slug) {
        return assessmentLinkRepository.findBySlug(slug)
                .filter(AssessmentLink::isActive)
                .map(a -> ResponseEntity.ok(Map.of(
                        "title", a.getTitle(),
                        "durationMinutes", a.getDurationMinutes(),
                        "questionCount", a.getQuestions().size()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Step 1: Verify password and return assessment metadata.
     * Students hit this first — no questions yet, just confirm access.
     */
    @PostMapping("/{slug}/verify")
    public ResponseEntity<?> verifyAccess(
            @PathVariable String slug,
            @RequestBody PasswordRequest req) {

        AssessmentLink assessment = assessmentLinkRepository.findBySlug(slug)
                .orElse(null);

        if (assessment == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Test not found. Check the link."));
        }

        if (!assessment.isActive()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "This test has been deactivated by your faculty."));
        }

        // Time window check
        LocalDateTime now = LocalDateTime.now();
        if (assessment.getStartTime() != null && now.isBefore(assessment.getStartTime())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Test hasn't started yet. Please wait."));
        }
        if (assessment.getEndTime() != null && now.isAfter(assessment.getEndTime())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Test window has closed."));
        }

        // Password check (plain comparison — password is set by faculty, not hashed)
        if (!assessment.getAccessPassword().equals(req.password())) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Incorrect password. Please try again."));
        }

        // Return metadata only (no questions yet)
        return ResponseEntity.ok(Map.of(
                "title", assessment.getTitle(),
                "questionCount", assessment.getQuestions().size(),
                "durationMinutes", assessment.getDurationMinutes(),
                "slug", slug
        ));
    }

    /**
     * Step 2: Load all questions for the test.
     * Password must be provided again (stateless — no session).
     * Uses JOIN FETCH query — loads everything in 1 SQL call for efficiency.
     */
    @PostMapping("/{slug}/questions")
    public ResponseEntity<?> getQuestions(
            @PathVariable String slug,
            @RequestBody PasswordRequest req) {

        AssessmentLink assessment = assessmentLinkRepository
                .findActiveBySlugWithQuestions(slug)
                .orElse(null);

        if (assessment == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Test not found or inactive."));
        }

        if (!assessment.getAccessPassword().equals(req.password())) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid password."));
        }

        // Build question list — options shuffled, correct answer NOT exposed
        List<Map<String, Object>> questions = assessment.getQuestions().stream().map(q -> {
            Map<String, Object> qMap = new LinkedHashMap<>();
            qMap.put("id", q.getId());
            qMap.put("text", q.getText());
            qMap.put("difficulty", q.getDifficulty().name());
            qMap.put("options", q.getOptions().stream().map(o -> Map.of(
                    "id", o.getId(),
                    "text", o.getText()
                    // NOTE: 'correct' field intentionally excluded from response
            )).toList());
            return qMap;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "title", assessment.getTitle(),
                "durationMinutes", assessment.getDurationMinutes(),
                "questions", questions
        ));
    }

    /**
     * Step 3: Submit answers and get score.
     * Answers: { questionId -> optionId }
     * Stateless scoring — compares submitted optionIds against DB correct flags.
     */
    @PostMapping("/{slug}/submit")
    public ResponseEntity<?> submitAnswers(
            @PathVariable String slug,
            @RequestBody SubmitRequest req) {

        AssessmentLink assessment = assessmentLinkRepository
                .findActiveBySlugWithQuestions(slug)
                .orElse(null);

        if (assessment == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Test not found."));
        }

        if (!assessment.getAccessPassword().equals(req.password())) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid password."));
        }

        int correct = 0, total = assessment.getQuestions().size();
        List<Map<String, Object>> resultDetail = new ArrayList<>();

        for (var q : assessment.getQuestions()) {
            Long submittedOptionId = req.answers().get(q.getId());
            var correctOption = q.getOptions().stream()
                    .filter(com.prepedge.entity.Option::isCorrect)
                    .findFirst().orElse(null);

            boolean isCorrect = correctOption != null
                    && correctOption.getId().equals(submittedOptionId);
            if (isCorrect) correct++;

            resultDetail.add(Map.of(
                    "questionId", q.getId(),
                    "questionText", q.getText(),
                    "correctOptionId", correctOption != null ? correctOption.getId() : -1,
                    "correctOptionText", correctOption != null ? correctOption.getText() : "",
                    "submittedOptionId", submittedOptionId != null ? submittedOptionId : -1,
                    "isCorrect", isCorrect
            ));
        }

        int percentage = total > 0 ? (correct * 100 / total) : 0;
        log.info("Assessment '{}' submitted by '{}' — {}/{} correct ({}%)",
                assessment.getTitle(), req.studentName(), correct, total, percentage);

        return ResponseEntity.ok(Map.of(
                "score", correct,
                "total", total,
                "percentage", percentage,
                "studentName", req.studentName(),
                "title", assessment.getTitle(),
                "result", resultDetail
        ));
    }

    // ── Inner records ──────────────────────────────────────────────────────

    record PasswordRequest(String password) {}

    record SubmitRequest(
            String password,
            String studentName,
            Map<Long, Long> answers  // questionId → optionId
    ) {}
}

