package com.ceos.brand.auth.product.repository;

import com.ceos.brand.auth.product.model.Product;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.math.BigDecimal;
import java.util.ArrayList;
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

    public List<Product> search(boolean includeHidden, String category, String status, String stock, BigDecimal minPrice, BigDecimal maxPrice) {
        StringBuilder sql = new StringBuilder(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE 1 = 1
            """
        );
        List<Object> params = new ArrayList<>();

        if (!includeHidden) {
            sql.append(" AND status <> 'Oculto'");
        }

        List<String> categories = splitFilter(category, "Todas");
        if (!categories.isEmpty()) {
            appendInFilter(sql, params, "category", categories);
        }

        List<String> statuses = splitFilter(status, "Todos");
        if (!statuses.isEmpty()) {
            appendInFilter(sql, params, "status", statuses);
        }

        if (minPrice != null) {
            sql.append(" AND price >= ?");
            params.add(minPrice);
        }

        if (maxPrice != null) {
            sql.append(" AND price <= ?");
            params.add(maxPrice);
        }

        List<String> stockFilters = splitFilter(stock, "todos");
        if (!stockFilters.isEmpty()) {
            List<String> stockConditions = new ArrayList<>();
            for (String stockFilter : stockFilters) {
                switch (stockFilter) {
                    case "cero" -> stockConditions.add("stock = 0");
                    case "bajo" -> stockConditions.add("stock BETWEEN 1 AND 10");
                    case "medio" -> stockConditions.add("stock BETWEEN 11 AND 50");
                    case "alto" -> stockConditions.add("stock > 50");
                    default -> {
                    }
                }
            }

            if (!stockConditions.isEmpty()) {
                sql.append(" AND (").append(String.join(" OR ", stockConditions)).append(")");
            }
        }

        sql.append(" ORDER BY id ASC");
        return jdbcTemplate.query(sql.toString(), productRowMapper, params.toArray());
    }

    private void appendInFilter(StringBuilder sql, List<Object> params, String column, List<String> values) {
        sql.append(" AND ").append(column).append(" IN (");
        sql.append(String.join(", ", values.stream().map(value -> "?").toList()));
        sql.append(")");
        params.addAll(values);
    }

    private List<String> splitFilter(String value, String allValue) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        List<String> values = new ArrayList<>();
        for (String item : value.split(",")) {
            String cleanValue = item.trim();
            if (!cleanValue.isBlank() && !allValue.equals(cleanValue)) {
                values.add(cleanValue);
            }
        }

        return values;
    }

    public List<Product> findVisible() {
        return jdbcTemplate.query(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE status <> 'Oculto'
            ORDER BY id ASC
            """,
            productRowMapper
        );
    }

    public List<Product> findFeatured(int limit) {
        return jdbcTemplate.query(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE status <> 'Oculto'
            ORDER BY id ASC
            LIMIT ?
            """,
            productRowMapper,
            limit
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

    public Optional<Product> findVisibleById(Long id) {
        List<Product> products = jdbcTemplate.query(
            """
            SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE id = ? AND status <> 'Oculto'
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

    public int decreaseStock(Long id, Integer quantity) {
        return jdbcTemplate.update(
            """
            UPDATE products
            SET stock = stock - ?
            WHERE id = ? AND stock >= ?
            """,
            quantity,
            id,
            quantity
        );
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
