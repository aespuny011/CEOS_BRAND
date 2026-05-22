package com.ceos.brand.auth.payment.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StripeCheckoutSessionRepository {

    private final JdbcTemplate jdbcTemplate;

    public StripeCheckoutSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void savePending(String sessionId, Long userId) {
        jdbcTemplate.update(
            """
            INSERT INTO stripe_checkout_sessions (id, user_id, status)
            VALUES (?, ?, 'PENDING')
            ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
            """,
            sessionId,
            userId
        );
    }

    public boolean isCompleted(String sessionId) {
        Boolean completed = jdbcTemplate.query(
            "SELECT status = 'COMPLETED' FROM stripe_checkout_sessions WHERE id = ?",
            rs -> rs.next() ? rs.getBoolean(1) : false,
            sessionId
        );
        return Boolean.TRUE.equals(completed);
    }

    public boolean tryMarkProcessing(String sessionId, Long userId) {
        int updated = jdbcTemplate.update(
            """
            UPDATE stripe_checkout_sessions
            SET status = 'PROCESSING'
            WHERE id = ? AND user_id = ? AND status IN ('PENDING', 'FAILED')
            """,
            sessionId,
            userId
        );
        return updated > 0;
    }

    public void markCompleted(String sessionId) {
        jdbcTemplate.update("UPDATE stripe_checkout_sessions SET status = 'COMPLETED' WHERE id = ?", sessionId);
    }

    public void markFailed(String sessionId) {
        jdbcTemplate.update("UPDATE stripe_checkout_sessions SET status = 'FAILED' WHERE id = ?", sessionId);
    }
}
