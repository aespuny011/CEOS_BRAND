package com.ceos.brand.auth.product.repository;

import com.ceos.brand.auth.product.model.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private final RowMapper<Product> productRowMapper = (rs, rowNum) -> new Product(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("category"),
        rs.getBigDecimal("price"),
        rs.getString("image_url"),
        parseImages(rs.getString("images_json")),
        rs.getString("description"),
        rs.getString("status"),
        rs.getInt("stock")
    );

    public ProductRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Product> findAll() {
        return jdbcTemplate.query(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            ORDER BY id ASC
            """,
            productRowMapper
        );
    }

    public Optional<Product> findById(Long id) {
        List<Product> products = jdbcTemplate.query(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE id = ?
            """,
            productRowMapper,
            id
        );

        return products.stream().findFirst();
    }

    public Product create(Product product) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                """
                INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, product.name());
            statement.setString(2, product.category());
            statement.setBigDecimal(3, product.price());
            statement.setString(4, product.imageUrl());
            statement.setString(5, writeImages(product.images()));
            statement.setString(6, product.description());
            statement.setString(7, product.status());
            statement.setInt(8, product.stock());
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("No se pudo obtener el id del producto.");
        }

        return new Product(
            key.longValue(),
            product.name(),
            product.category(),
            product.price(),
            product.imageUrl(),
            product.images(),
            product.description(),
            product.status(),
            product.stock()
        );
    }

    public Product update(Long id, Product product) {
        jdbcTemplate.update(
            """
            UPDATE products
            SET name = ?, category = ?, price = ?, image_url = ?, images_json = ?, description = ?, status = ?, stock = ?
            WHERE id = ?
            """,
            product.name(),
            product.category(),
            product.price(),
            product.imageUrl(),
            writeImages(product.images()),
            product.description(),
            product.status(),
            product.stock(),
            id
        );

        return new Product(
            id,
            product.name(),
            product.category(),
            product.price(),
            product.imageUrl(),
            product.images(),
            product.description(),
            product.status(),
            product.stock()
        );
    }

    public boolean delete(Long id) {
        return jdbcTemplate.update("DELETE FROM products WHERE id = ?", id) > 0;
    }

    private List<String> parseImages(String imagesJson) {
        try {
            return objectMapper.readValue(imagesJson, new TypeReference<>() {});
        } catch (Exception exception) {
            return List.of();
        }
    }

    private String writeImages(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images == null ? List.of() : images);
        } catch (Exception exception) {
            return "[]";
        }
    }
}
