package com.prepedge.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessment_links", indexes = {
    @Index(name = "idx_assessment_slug", columnList = "slug", unique = true),
    @Index(name = "idx_assessment_faculty", columnList = "faculty_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique 8-char URL slug — e.g. "abc12xyz" → /test/abc12xyz */
    @Column(nullable = false, unique = true, length = 16)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    /** Plain-text access password (faculty sets this, students enter it) */
    @Column(name = "access_password", nullable = false, length = 100)
    private String accessPassword;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;

    /**
     * Questions in this assessment.
     * Indexed join table for fast lookup — critical for high concurrency.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "assessment_questions",
        joinColumns = @JoinColumn(name = "assessment_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id"),
        indexes = {
            @Index(name = "idx_aq_assessment", columnList = "assessment_id"),
            @Index(name = "idx_aq_question", columnList = "question_id")
        }
    )
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    /** When set, students can only access within this window */
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    /** Faculty can deactivate link to stop new attempts */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
