package com.prepedge.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prepedge.entity.*;
import com.prepedge.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final SeedFileRepository seedFileRepository;
    private final CompanyRepository companyRepository;
    private final MockTestRepository mockTestRepository;
    private final MockTestQuestionRepository mockTestQuestionRepository;

    private final Map<String, Subject> subjectCache = new HashMap<>();
    private final Map<String, Topic> topicCache = new HashMap<>();

    @Override
    public void run(String... args) throws Exception {
        seedQuestionFiles();
        seedMockTestFiles();
    }

    // ── Question bank seeding ──────────────────────────────────────────────

    private void seedQuestionFiles() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver();
        Resource[] resources =
                resolver.getResources("classpath:questions/*.json");

        int totalFilesImported = 0;
        int totalQuestionsImported = 0;

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) continue;

            if (seedFileRepository.existsByFilename(filename)) {
                log.info("Skipping {} — already imported.", filename);
                continue;
            }

            log.info("Importing question file: {}", filename);
            try (InputStream is = resource.getInputStream()) {
                List<SeedQuestion> seedQuestions = mapper.readValue(is,
                        mapper.getTypeFactory()
                                .constructCollectionType(List.class,
                                        SeedQuestion.class));

                int count = 0;
                for (SeedQuestion sq : seedQuestions) {
                    importQuestion(sq);
                    count++;
                }

                seedFileRepository.save(SeedFile.builder()
                        .filename(filename)
                        .questionsImported(count)
                        .build());

                totalFilesImported++;
                totalQuestionsImported += count;
                log.info("Imported {} questions from {}", count, filename);

            } catch (Exception e) {
                log.error("Failed to import {}: {}", filename, e.getMessage());
            }
        }

        if (totalFilesImported == 0) {
            log.info("No new question files to import.");
        } else {
            log.info("Question seed complete: {} file(s), {} questions.",
                    totalFilesImported, totalQuestionsImported);
        }
    }

    private void importQuestion(SeedQuestion sq) {
        Subject subject = subjectCache.computeIfAbsent(sq.subject(), name ->
                subjectRepository.findAll().stream()
                        .filter(s -> s.getName().equalsIgnoreCase(name))
                        .findFirst()
                        .orElseGet(() -> subjectRepository.save(
                                Subject.builder().name(name).build()))
        );

        String topicKey = sq.subject() + "::" + sq.topic();
        Topic topic = topicCache.computeIfAbsent(topicKey, key ->
                topicRepository.findBySubjectId(subject.getId()).stream()
                        .filter(t -> t.getName().equalsIgnoreCase(sq.topic()))
                        .findFirst()
                        .orElseGet(() -> topicRepository.save(
                                Topic.builder().name(sq.topic())
                                        .subject(subject).build()))
        );

        Question question = Question.builder()
                .text(sq.text())
                .difficulty(Difficulty.valueOf(sq.difficulty().toUpperCase()))
                .explanation(sq.explanation())
                .topic(topic)
                .build();

        List<Option> options = sq.options().stream()
                .map(o -> Option.builder()
                        .text(o.text())
                        .correct(o.correct())
                        .question(question)
                        .build())
                .toList();

        question.setOptions(options);
        questionRepository.save(question);
    }

    // ── Mock test seeding ──────────────────────────────────────────────────

    private void seedMockTestFiles() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver();
        Resource[] resources;

        try {
            resources = resolver.getResources("classpath:mock-tests/*.json");
        } catch (Exception e) {
            log.info("No mock-tests folder found, skipping.");
            return;
        }

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) continue;

            String trackingKey = "mock-test::" + filename;
            if (seedFileRepository.existsByFilename(trackingKey)) {
                log.info("Skipping mock test {} — already imported.", filename);
                continue;
            }

            log.info("Importing mock test: {}", filename);
            try (InputStream is = resource.getInputStream()) {
                SeedMockTest smt = mapper.readValue(is, SeedMockTest.class);
                importMockTest(smt);

                seedFileRepository.save(SeedFile.builder()
                        .filename(trackingKey)
                        .questionsImported(smt.questions().size())
                        .build());

                log.info("Imported mock test '{}' with {} questions.",
                        smt.title(), smt.questions().size());

            } catch (Exception e) {
                log.error("Failed to import mock test {}: {}",
                        filename, e.getMessage());
            }
        }
    }

    private void importMockTest(SeedMockTest smt) {
        // Find or create company
        Company company = companyRepository.findBySlug(smt.companySlug())
                .orElseGet(() -> companyRepository.save(
                        Company.builder()
                                .name(smt.companyName())
                                .slug(smt.companySlug())
                                .build()));

        // Determine total questions
        int totalQ = 0;
        if (smt.sections() != null && !smt.sections().isEmpty()) {
            for (SeedSection sec : smt.sections()) {
                totalQ += sec.questions().size();
            }
        } else if (smt.questions() != null) {
            totalQ = smt.questions().size();
        }

        MockTest mockTest = MockTest.builder()
                .company(company)
                .title(smt.title())
                .description(smt.description())
                .durationMinutes(smt.durationMinutes())
                .totalQuestions(totalQ)
                .active(true)
                .build();
        mockTest = mockTestRepository.save(mockTest);

        int order = 1;

        // ── New sectioned format (self-contained inline questions) ──
        if (smt.sections() != null && !smt.sections().isEmpty()) {
            for (SeedSection section : smt.sections()) {
                String subjectName = section.subject() != null ? section.subject() : section.name();
                String topicName   = section.topic()   != null ? section.topic()   : section.name();

                Subject subject = subjectCache.computeIfAbsent(subjectName, k ->
                        subjectRepository.findAll().stream()
                                .filter(s -> s.getName().equalsIgnoreCase(k))
                                .findFirst()
                                .orElseGet(() -> subjectRepository.save(
                                        Subject.builder().name(k).build())));

                String topicCacheKey = subjectName + "::" + topicName;
                Topic topic = topicCache.computeIfAbsent(topicCacheKey, k ->
                        topicRepository.findBySubjectId(subject.getId()).stream()
                                .filter(t -> t.getName().equalsIgnoreCase(topicName))
                                .findFirst()
                                .orElseGet(() -> topicRepository.save(
                                        Topic.builder().name(topicName).subject(subject).build())));

                for (SeedInlineQuestion iq : section.questions()) {
                    Question q = Question.builder()
                            .text(iq.text())
                            .topic(topic)
                            .difficulty(Difficulty.MEDIUM)
                            .explanation(iq.explanation() != null ? iq.explanation() : "")
                            .build();

                    q = questionRepository.save(q);

                    List<Option> opts = new java.util.ArrayList<>();
                    for (int i = 0; i < iq.options().size(); i++) {
                        opts.add(Option.builder()
                                .text(iq.options().get(i))
                                .correct(i == iq.correctIndex())
                                .question(q)
                                .build());
                    }
                    q.setOptions(opts);
                    questionRepository.save(q);

                    MockTestQuestion mtq = MockTestQuestion.builder()
                            .mockTest(mockTest)
                            .question(q)
                            .questionOrder(order++)
                            .build();
                    mockTestQuestionRepository.save(mtq);
                }
            }
        } else if (smt.questions() != null) {
            // ── Legacy format: match by question bank text ──
            for (String questionText : smt.questions()) {
                List<Question> matches = questionRepository
                        .findByTextContainingIgnoreCase(questionText.substring(0,
                                Math.min(50, questionText.length())));
                if (matches.isEmpty()) {
                    log.warn("No question found matching: {}...",
                            questionText.substring(0, Math.min(40, questionText.length())));
                    continue;
                }
                Question q = matches.get(0);
                MockTestQuestion mtq = MockTestQuestion.builder()
                        .mockTest(mockTest)
                        .question(q)
                        .questionOrder(order++)
                        .build();
                mockTestQuestionRepository.save(mtq);
            }
        }

        mockTest.setTotalQuestions(order - 1);
        mockTestRepository.save(mockTest);
        log.info("Imported '{}' with {} questions.", smt.title(), order - 1);
    }

    // ── Internal record types ──────────────────────────────────────────────

    private record SeedQuestion(
            String subject, String topic, String difficulty,
            String text, String explanation, List<SeedOption> options) {}

    private record SeedOption(String text, boolean correct) {}

    private record SeedMockTest(
            String companyName, String companySlug, String title,
            String description, int durationMinutes,
            List<String> questions,         // legacy: text refs to question bank
            List<SeedSection> sections      // new: self-contained sectioned questions
    ) {}

    private record SeedSection(
            String name,
            String subject,
            String topic,
            int timeMinutes,
            List<SeedInlineQuestion> questions
    ) {}

    private record SeedInlineQuestion(
            String text,
            List<String> options,
            int correctIndex,
            String explanation
    ) {}
}