package com.ceos.brand.auth.auth.repository;

import com.ceos.brand.auth.auth.model.User;
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
public class UserRepository {

    private static final RowMapper<User> USER_ROW_MAPPER = (rs, rowNum) -> new User(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("email"),
        rs.getString("password_hash")
    );

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            USER_ROW_MAPPER,
            email
        );

        return users.stream().findFirst();
    }

    public Optional<User> findById(Long id) {
        List<User> users = jdbcTemplate.query(
            "SELECT id, name, email, password_hash FROM users WHERE id = ?",
            USER_ROW_MAPPER,
            id
        );

        return users.stream().findFirst();
    }

    public User create(String name, String email, String passwordHash) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, name);
            statement.setString(2, email);
            statement.setString(3, passwordHash);
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("No se pudo obtener el id del usuario creado.");
        }

        return new User(key.longValue(), name, email, passwordHash);
    }
}
