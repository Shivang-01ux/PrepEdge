package com.prepedge.repository;

import com.prepedge.entity.AssessmentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AssessmentLinkRepository extends JpaRepository<AssessmentLink, Long> {

    boolean existsBySlug(String slug);

    Optional<AssessmentLink> findBySlug(String slug);

    List<AssessmentLink> findByFacultyId(Long facultyId);

    /** Load assessment with questions eagerly — avoids N+1 for concurrent access */
    @Query("SELECT DISTINCT a FROM AssessmentLink a " +
           "LEFT JOIN FETCH a.questions q " +
           "LEFT JOIN FETCH q.options " +
           "WHERE a.slug = :slug AND a.active = true")
    Optional<AssessmentLink> findActiveBySlugWithQuestions(@Param("slug") String slug);
}
