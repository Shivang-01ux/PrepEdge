package com.prepedge.repository;

import com.prepedge.entity.MockTest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MockTestRepository extends JpaRepository<MockTest, Long> {
    List<MockTest> findByActiveTrue();
    List<MockTest> findByCompanyIdAndActiveTrue(Long companyId);
    Optional<MockTest> findByTitleAndCompanyId(String title, Long companyId);
}