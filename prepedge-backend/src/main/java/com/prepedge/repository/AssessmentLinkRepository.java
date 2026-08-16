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

    Optional<AssessmentLink> findBySlugAndActiveTrue(String slug);

    List<AssessmentLink> findByFacultyId(Long facultyId);

    /**
     * Loads assessment + questions in ONE SQL query.
     * Options are intentionally NOT JOIN FETCHed here —
     * fetching two List bags simultaneously causes Hibernate
     * MultipleBagFetchException. Options load lazily via
     * open-session-in-view (enabled by default in Spring Boot).
     */
    @Query("SELECT DISTINCT a FROM AssessmentLink a " +
           "LEFT JOIN FETCH a.questions " +
           "WHERE a.slug = :slug AND a.active = true")
    Optional<AssessmentLink> findActiveBySlugWithQuestions(@Param("slug") String slug);
}
