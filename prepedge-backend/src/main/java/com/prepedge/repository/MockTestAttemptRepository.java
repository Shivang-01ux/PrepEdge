package com.prepedge.repository;

import com.prepedge.entity.MockTestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MockTestAttemptRepository
        extends JpaRepository<MockTestAttempt, Long> {
    List<MockTestAttempt> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<MockTestAttempt> findByUserIdAndMockTestIdAndStatus(
            Long userId, Long mockTestId,
            com.prepedge.entity.MockTestStatus status);
    void deleteAllByMockTestId(Long mockTestId);
}