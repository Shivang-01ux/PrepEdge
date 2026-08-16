package com.prepedge.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once on startup (before DataSeeder via ApplicationReadyEvent ordering).
 * Fixes the users_role_check PostgreSQL constraint to allow ROLE_FACULTY
 * instead of the old ROLE_RECRUITER that was removed.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigration {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    @Order(1)
    public void fixRoleConstraint() {
        try {
            // Drop old constraint (safe - IF EXISTS means no error if already gone)
            jdbcTemplate.execute(
                "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"
            );

            // Add updated constraint with ROLE_FACULTY instead of ROLE_RECRUITER
            jdbcTemplate.execute(
                "ALTER TABLE users ADD CONSTRAINT users_role_check " +
                "CHECK (role IN ('ROLE_STUDENT', 'ROLE_ADMIN', 'ROLE_FACULTY'))"
            );

            log.info("Migration: users_role_check constraint updated → allows ROLE_FACULTY");

        } catch (Exception e) {
            // Constraint may already be correct — log and continue
            log.warn("Migration: role constraint update skipped ({})", e.getMessage());
        }
    }
}
