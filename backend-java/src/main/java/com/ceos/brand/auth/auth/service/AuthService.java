package com.ceos.brand.auth.auth.service;

import com.ceos.brand.auth.auth.AuthSessionKeys;
import com.ceos.brand.auth.auth.dto.AuthUserResponse;
import com.ceos.brand.auth.auth.dto.LoginRequest;
import com.ceos.brand.auth.auth.dto.RegisterRequest;
import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.repository.UserRepository;
import com.ceos.brand.auth.common.ApiException;
import jakarta.servlet.http.HttpSession;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthUserResponse register(RegisterRequest request, HttpSession session) {
        String normalizedName = normalizeName(request.name());
        String normalizedEmail = normalizeEmail(request.email());

        if (normalizedName.isBlank() || normalizedEmail.isBlank() || request.password().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Todos los campos son obligatorios.");
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email.");
        }

        User user = userRepository.create(
            normalizedName,
            normalizedEmail,
            passwordEncoder.encode(request.password())
        );

        storeUserInSession(session, user);
        return toResponse(user);
    }

    public AuthUserResponse login(LoginRequest request, HttpSession session) {
        String normalizedEmail = normalizeEmail(request.email());

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas."));

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
        }

        storeUserInSession(session, user);
        return toResponse(user);
    }

    public AuthUserResponse getCurrentUser(HttpSession session) {
        if (session == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No hay sesion activa.");
        }

        Object userIdValue = session.getAttribute(AuthSessionKeys.USER_ID);
        Long userId;

        if (userIdValue instanceof Long longId) {
            userId = longId;
        } else if (userIdValue instanceof Integer integerId) {
            userId = integerId.longValue();
        } else {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No hay sesion activa.");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No hay sesion activa."));

        return toResponse(user);
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }

    private void storeUserInSession(HttpSession session, User user) {
        session.setAttribute(AuthSessionKeys.USER_ID, user.id());
        session.setAttribute(AuthSessionKeys.USER_NAME, user.name());
        session.setAttribute(AuthSessionKeys.USER_EMAIL, user.email());
    }

    private AuthUserResponse toResponse(User user) {
        return new AuthUserResponse(user.id(), user.name(), user.email());
    }

    private String normalizeName(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
