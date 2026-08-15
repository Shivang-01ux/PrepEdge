package com.prepedge.repository;

import com.prepedge.entity.SeedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SeedFileRepository extends JpaRepository<SeedFile, Long> {
    boolean existsByFilename(String filename);
    Optional<SeedFile> findByFilename(String filename);
}