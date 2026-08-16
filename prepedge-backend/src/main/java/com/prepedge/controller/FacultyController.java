package com.prepedge.controller;

import com.opencsv.CSVReader;
import com.prepedge.dto.response.BulkUploadResponse;
import com.prepedge.entity.*;
import com.prepedge.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class FacultyController {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final OptionRepository optionRepository;
    private final AssessmentLinkRepository assessmentLinkRepository;

    // ── Helpers ────────────────────────────────────────────────────────────

    private Subject findOrCreateSubject(String name) {
        return subjectRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> subjectRepository.save(Subject.builder().name(name).build()));
    }

    private Topic findOrCreateTopic(Subject subject, String topicName) {
        return topicRepository.findBySubjectId(subject.getId()).stream()
                .filter(t -> t.getName().equalsIgnoreCase(topicName))
                .findFirst()
                .orElseGet(() -> topicRepository.save(Topic.builder().name(topicName).subject(subject).build()));
    }

    private Question saveQuestionWithOptions(
            String text, String optA, String optB, String optC, String optD,
            char correctChar, Topic topic, Difficulty difficulty, String explanation) {

        // 1. Save question first (gets generated ID)
        Question q = Question.builder()
                .text(text)
                .topic(topic)
                .difficulty(difficulty)
                .explanation(explanation != null ? explanation : "")
                .build();
        q = questionRepository.save(q);

        // 2. Save each option with the question reference
        String[] opts = {optA, optB, optC, optD};
        for (int i = 0; i < 4; i++) {
            optionRepository.save(Option.builder()
                    .text(opts[i])
                    .correct(('A' + i) == correctChar)
                    .question(q)
                    .build());
        }
        return q;
    }

    // ── Single question upload ─────────────────────────────────────────────

    @PostMapping("/questions")
    @Transactional
    public ResponseEntity<?> addQuestion(@RequestBody SingleQuestionRequest req) {
        try {
            Subject subject = findOrCreateSubject(req.subject());
            Topic topic = findOrCreateTopic(subject, req.topic());
            Difficulty difficulty = Difficulty.valueOf(req.difficulty().toUpperCase());
            char correct = req.correctOption().toUpperCase().charAt(0);

            Question q = saveQuestionWithOptions(
                    req.questionText(), req.optionA(), req.optionB(), req.optionC(), req.optionD(),
                    correct, topic, difficulty, req.explanation());

            return ResponseEntity.ok(Map.of("message", "Question added successfully", "id", q.getId()));
        } catch (Exception e) {
            log.error("Failed to add question: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to save question: " + e.getMessage()));
        }
    }

    // ── Bulk CSV upload ────────────────────────────────────────────────────

    @PostMapping(value = "/questions/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<BulkUploadResponse> bulkUpload(@RequestParam("file") MultipartFile file) {
        int uploaded = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String[] header = reader.readNext();
            if (header == null) {
                return ResponseEntity.badRequest()
                        .body(new BulkUploadResponse(0, 0, List.of("Empty file")));
            }

            String[] row;
            int rowNum = 2;
            while ((row = reader.readNext()) != null) {
                if (row.length < 9) {
                    errors.add("Row " + rowNum + ": insufficient columns (expected 9)");
                    failed++; rowNum++; continue;
                }

                String questionText = row[0].trim();
                String optA = row[1].trim(), optB = row[2].trim();
                String optC = row[3].trim(), optD = row[4].trim();
                String correctOpt = row[5].trim().toUpperCase();
                String subjectName = row[6].trim();
                String topicName = row[7].trim();
                String difficultyStr = row[8].trim().toUpperCase();

                if (questionText.isEmpty()) {
                    errors.add("Row " + rowNum + ": question_text is empty");
                    failed++; rowNum++; continue;
                }
                if (!Set.of("A", "B", "C", "D").contains(correctOpt)) {
                    errors.add("Row " + rowNum + ": correct_option must be A, B, C, or D");
                    failed++; rowNum++; continue;
                }
                if (!Set.of("EASY", "MEDIUM", "HARD").contains(difficultyStr)) {
                    errors.add("Row " + rowNum + ": difficulty must be EASY, MEDIUM, or HARD");
                    failed++; rowNum++; continue;
                }
                if (subjectName.isEmpty() || topicName.isEmpty()) {
                    errors.add("Row " + rowNum + ": subject and topic are required");
                    failed++; rowNum++; continue;
                }

                try {
                    Subject subject = findOrCreateSubject(subjectName);
                    Topic topic = findOrCreateTopic(subject, topicName);
                    saveQuestionWithOptions(questionText, optA, optB, optC, optD,
                            correctOpt.charAt(0), topic, Difficulty.valueOf(difficultyStr), "");
                    uploaded++;
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                    failed++;
                }
                rowNum++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new BulkUploadResponse(0, 0, List.of("Failed to parse CSV: " + e.getMessage())));
        }

        return ResponseEntity.ok(new BulkUploadResponse(uploaded, failed, errors));
    }

    // ── Assessment Links ───────────────────────────────────────────────────

    /**
     * Faculty creates an assessment link from uploaded questions.
     * Generates a unique slug and hashes the access password.
     * Students access via: /test/{slug}  (enter password to unlock)
     */
    @PostMapping("/assessments")
    @Transactional
    public ResponseEntity<?> createAssessment(
            @RequestBody CreateAssessmentRequest req,
            Authentication auth) {
        try {
            User faculty = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            // Fetch selected questions
            List<Question> questions = questionRepository.findAllById(req.questionIds());
            if (questions.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "No valid questions selected"));
            }

            // Generate unique 8-char slug
            String slug = generateSlug();

            AssessmentLink assessment = AssessmentLink.builder()
                    .slug(slug)
                    .title(req.title())
                    .accessPassword(req.accessPassword())
                    .durationMinutes(req.durationMinutes())
                    .faculty(faculty)
                    .questions(questions)
                    .active(true)
                    .startTime(req.startTime())
                    .endTime(req.endTime())
                    .build();

            assessmentLinkRepository.save(assessment);

            String link = "/test/" + slug;
            return ResponseEntity.ok(Map.of(
                    "slug", slug,
                    "link", link,
                    "title", req.title(),
                    "questionCount", questions.size(),
                    "duration", req.durationMinutes()
            ));
        } catch (Exception e) {
            log.error("Failed to create assessment: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to create assessment: " + e.getMessage()));
        }
    }

    /** List all assessments created by this faculty */
    @GetMapping("/assessments")
    public ResponseEntity<List<Map<String, Object>>> listAssessments(Authentication auth) {
        User faculty = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        List<AssessmentLink> assessments = assessmentLinkRepository.findByFacultyId(faculty.getId());
        List<Map<String, Object>> result = assessments.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("slug", a.getSlug());
            m.put("link", "/test/" + a.getSlug());
            m.put("title", a.getTitle());
            m.put("questionCount", a.getQuestions().size());
            m.put("durationMinutes", a.getDurationMinutes());
            m.put("active", a.isActive());
            m.put("startTime", a.getStartTime() != null ? a.getStartTime().toString() : null);
            m.put("endTime", a.getEndTime() != null ? a.getEndTime().toString() : null);
            m.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    /** Toggle assessment active/inactive */
    @PatchMapping("/assessments/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleAssessment(@PathVariable Long id, Authentication auth) {
        User faculty = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        AssessmentLink a = assessmentLinkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        if (!a.getFaculty().getId().equals(faculty.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Not your assessment"));
        }

        a.setActive(!a.isActive());
        assessmentLinkRepository.save(a);
        return ResponseEntity.ok(Map.of("active", a.isActive()));
    }

    // ── Student Assessment Access (public endpoint under /api/test) ────────
    // NOTE: The actual student-facing test endpoints are in AssessmentController

    // ── Department students ────────────────────────────────────────────────

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentStudents(Authentication auth) {
        User faculty = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        List<User> students = userRepository.findByDepartmentAndRole(faculty.getDepartment(), Role.ROLE_STUDENT);
        List<Map<String, Object>> result = students.stream().map(s -> Map.<String, Object>of(
                "id", s.getId(),
                "username", s.getUsername(),
                "email", s.getEmail(),
                "department", s.getDepartment() != null ? s.getDepartment() : "",
                "college", s.getCollege() != null ? s.getCollege() : "",
                "createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : ""
        )).toList();

        return ResponseEntity.ok(result);
    }

    // ── Slug generator ─────────────────────────────────────────────────────

    private static final String CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RNG = new SecureRandom();

    private String generateSlug() {
        String slug;
        do {
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 8; i++) sb.append(CHARS.charAt(RNG.nextInt(CHARS.length())));
            slug = sb.toString();
        } while (assessmentLinkRepository.existsBySlug(slug));
        return slug;
    }

    // ── Inner records ──────────────────────────────────────────────────────

    record SingleQuestionRequest(
            String questionText, String optionA, String optionB,
            String optionC, String optionD, String correctOption,
            String subject, String topic, String difficulty, String explanation) {}

    record CreateAssessmentRequest(
            String title,
            String accessPassword,
            Integer durationMinutes,
            List<Long> questionIds,
            LocalDateTime startTime,
            LocalDateTime endTime) {}
}
