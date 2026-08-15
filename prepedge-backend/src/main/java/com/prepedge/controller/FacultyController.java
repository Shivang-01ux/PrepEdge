package com.prepedge.controller;

import com.opencsv.CSVReader;
import com.prepedge.dto.response.BulkUploadResponse;
import com.prepedge.entity.*;
import com.prepedge.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacultyController {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final MockTestAttemptRepository mockTestAttemptRepository;

    // ── Single question upload ─────────────────────────────────────────────

    @PostMapping("/questions")
    public ResponseEntity<?> addQuestion(
            @Valid @RequestBody SingleQuestionRequest req) {

        Subject subject = subjectRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(req.subject()))
                .findFirst()
                .orElseGet(() -> subjectRepository.save(
                        Subject.builder().name(req.subject()).build()));

        String topicKey = req.subject() + "::" + req.topic();
        Topic topic = topicRepository.findBySubjectId(subject.getId()).stream()
                .filter(t -> t.getName().equalsIgnoreCase(req.topic()))
                .findFirst()
                .orElseGet(() -> topicRepository.save(
                        Topic.builder().name(req.topic()).subject(subject).build()));

        Difficulty difficulty = Difficulty.valueOf(req.difficulty().toUpperCase());

        Question question = Question.builder()
                .text(req.questionText())
                .topic(topic)
                .difficulty(difficulty)
                .explanation(req.explanation() != null ? req.explanation() : "")
                .build();
        question = questionRepository.save(question);

        List<Option> options = new ArrayList<>();
        String[] opts = {req.optionA(), req.optionB(), req.optionC(), req.optionD()};
        char correct = req.correctOption().toUpperCase().charAt(0);
        for (int i = 0; i < opts.length; i++) {
            options.add(Option.builder()
                    .text(opts[i])
                    .correct(('A' + i) == correct)
                    .question(question)
                    .build());
        }
        question.setOptions(options);
        questionRepository.save(question);

        return ResponseEntity.ok(Map.of(
                "message", "Question added successfully",
                "id", question.getId()
        ));
    }

    // ── Bulk CSV upload ────────────────────────────────────────────────────

    @PostMapping(value = "/questions/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BulkUploadResponse> bulkUpload(
            @RequestParam("file") MultipartFile file) {

        int uploaded = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        try (CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String[] header = reader.readNext(); // skip header row
            if (header == null) {
                return ResponseEntity.badRequest().body(
                        new BulkUploadResponse(0, 0, List.of("Empty file")));
            }

            String[] row;
            int rowNum = 2;
            while ((row = reader.readNext()) != null) {
                if (row.length < 9) {
                    errors.add("Row " + rowNum + ": insufficient columns (expected 9)");
                    failed++;
                    rowNum++;
                    continue;
                }

                String questionText = row[0].trim();
                String optA = row[1].trim(), optB = row[2].trim();
                String optC = row[3].trim(), optD = row[4].trim();
                String correctOpt = row[5].trim().toUpperCase();
                String subjectName = row[6].trim();
                String topicName = row[7].trim();
                String difficultyStr = row[8].trim().toUpperCase();

                // Validate
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
                    Subject subject = subjectRepository.findAll().stream()
                            .filter(s -> s.getName().equalsIgnoreCase(subjectName))
                            .findFirst()
                            .orElseGet(() -> subjectRepository.save(
                                    Subject.builder().name(subjectName).build()));

                    final Subject finalSubject = subject;
                    Topic topic = topicRepository.findBySubjectId(subject.getId()).stream()
                            .filter(t -> t.getName().equalsIgnoreCase(topicName))
                            .findFirst()
                            .orElseGet(() -> topicRepository.save(
                                    Topic.builder().name(topicName).subject(finalSubject).build()));

                    Question q = Question.builder()
                            .text(questionText)
                            .topic(topic)
                            .difficulty(Difficulty.valueOf(difficultyStr))
                            .explanation("")
                            .build();
                    q = questionRepository.save(q);

                    String[] opts = {optA, optB, optC, optD};
                    char correct = correctOpt.charAt(0);
                    List<Option> options = new ArrayList<>();
                    for (int i = 0; i < 4; i++) {
                        options.add(Option.builder()
                                .text(opts[i])
                                .correct(('A' + i) == correct)
                                .question(q)
                                .build());
                    }
                    q.setOptions(options);
                    questionRepository.save(q);
                    uploaded++;
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                    failed++;
                }
                rowNum++;
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new BulkUploadResponse(0, 0, List.of("Failed to parse CSV: " + e.getMessage())));
        }

        return ResponseEntity.ok(new BulkUploadResponse(uploaded, failed, errors));
    }

    // ── Department student results ─────────────────────────────────────────

    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentStudents(
            Authentication authentication) {

        String email = authentication.getName();
        User faculty = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        String dept = faculty.getDepartment();
        List<User> students = userRepository.findByDepartmentAndRole(dept, Role.ROLE_STUDENT);

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

    // ── Inner record for single question request ───────────────────────────
    record SingleQuestionRequest(
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctOption,
            String subject,
            String topic,
            String difficulty,
            String explanation
    ) {}
}
