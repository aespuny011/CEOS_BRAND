package com.ceos.brand.auth.cart.repository;

import com.ceos.brand.auth.cart.model.CartItem;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class CartRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<CartItem> cartItemRowMapper = (rs, rowNum) -> new CartItem(
        rs.getLong("product_id"),
        rs.getString("name"),
        rs.getBigDecimal("price"),
        rs.getString("image_url"),
        rs.getString("category"),
        rs.getString("status"),
        rs.getInt("quantity"),
        rs.getInt("stock")
    );

    public CartRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CartItem> findByUserId(Long userId) {
        return jdbcTemplate.query(
            """
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.category, p.status, p.stock
            FROM cart_items ci
            INNER JOIN products p ON p.id = ci.product_id
            WHERE ci.user_id = ?
            ORDER BY ci.created_at ASC
            """,
            cartItemRowMapper,
            userId
        );
    }

    public int findQuantity(Long userId, Long productId) {
        Integer quantity = jdbcTemplate.query(
            "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
            rs -> rs.next() ? rs.getInt("quantity") : null,
            userId,
            productId
        );
        return quantity == null ? 0 : quantity;
    }

    public void upsert(Long userId, Long productId, Integer quantity) {
        jdbcTemplate.update(
            """
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
            """,
            userId,
            productId,
            quantity
        );
    }

    public void remove(Long userId, Long productId) {
        jdbcTemplate.update("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", userId, productId);
    }

    public void clear(Long userId) {
        jdbcTemplate.update("DELETE FROM cart_items WHERE user_id = ?", userId);
    }
}
