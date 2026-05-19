package com.ceos.brand.auth.auth.service;

import com.ceos.brand.auth.auth.AuthSessionKeys;
import com.ceos.brand.auth.auth.dto.AuthUserResponse;
import com.ceos.brand.auth.auth.dto.LoginRequest;
import com.ceos.brand.auth.auth.dto.PasswordUpdateRequest;
import com.ceos.brand.auth.auth.dto.ProfileUpdateRequest;
import com.ceos.brand.auth.auth.dto.RegisterRequest;
import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.repository.UserRepository;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.email.service.MarketingEmailService;
import jakarta.servlet.http.HttpSession;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_CUSTOMER = "CUSTOMER";

    private final UserRepository userRepository;
    private final MarketingEmailService marketingEmailService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, MarketingEmailService marketingEmailService) {
        this.userRepository = userRepository;
        this.marketingEmailService = marketingEmailService;
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
        marketingEmailService.sendWelcomeEmail(user);
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

    public AuthUserResponse updateProfile(ProfileUpdateRequest request, HttpSession session) {
        User currentUser = getCurrentUserEntity(session);
        String normalizedName = normalizeName(request.name());
        String normalizedEmail = normalizeEmail(request.email());

        userRepository.findByEmail(normalizedEmail)
            .filter(user -> !user.id().equals(currentUser.id()))
            .ifPresent(user -> {
                throw new ApiException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese email.");
            });

        User updatedUser = userRepository.updateProfile(currentUser.id(), normalizedName, normalizedEmail);
        storeUserInSession(session, updatedUser);
        return toResponse(updatedUser);
    }

    public void updatePassword(PasswordUpdateRequest request, HttpSession session) {
        User currentUser = getCurrentUserEntity(session);

        if (!passwordEncoder.matches(request.currentPassword(), currentUser.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "La contraseña actual no es correcta.");
        }

        validatePasswordStrength(request.newPassword());

        if (passwordEncoder.matches(request.newPassword(), currentUser.passwordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe ser distinta a la actual.");
        }

        userRepository.updatePassword(currentUser.id(), passwordEncoder.encode(request.newPassword()));
    }

    public boolean isAdmin(User user) {
        return user != null && ADMIN_EMAIL.equals(normalizeEmail(user.email()));
    }

    public void requireAdmin(HttpSession session) {
        User user = getCurrentUserEntity(session);
        if (!isAdmin(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta accion.");
        }
    }

    public User getCurrentUserEntity(HttpSession session) {
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

        return userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No hay sesion activa."));
    }

    private void storeUserInSession(HttpSession session, User user) {
        session.setAttribute(AuthSessionKeys.USER_ID, user.id());
        session.setAttribute(AuthSessionKeys.USER_NAME, user.name());
        session.setAttribute(AuthSessionKeys.USER_EMAIL, user.email());
    }

    private AuthUserResponse toResponse(User user) {
        boolean admin = isAdmin(user);
        return new AuthUserResponse(
            user.id(),
            user.name(),
            user.email(),
            admin ? ROLE_ADMIN : ROLE_CUSTOMER,
            admin
        );
    }

    private String normalizeName(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña es obligatoria.");
        }

        if (password.length() < 8) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener al menos 8 caracteres.");
        }

        if (!password.chars().anyMatch(Character::isUpperCase)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe incluir una mayúscula.");
        }

        if (!password.chars().anyMatch(Character::isLowerCase)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe incluir una minúscula.");
        }

        if (!password.chars().anyMatch(Character::isDigit)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe incluir un número.");
        }

        if (password.chars().anyMatch(Character::isWhitespace)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña no puede contener espacios.");
        }

        boolean hasSpecial = password.chars().anyMatch(character ->
            !Character.isLetterOrDigit(character) && !Character.isWhitespace(character)
        );

        if (!hasSpecial) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe incluir un símbolo.");
        }
    }
}
