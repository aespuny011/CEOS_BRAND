package com.ceos.brand.auth.auth.controller;

import com.ceos.brand.auth.auth.dto.AuthUserResponse;
import com.ceos.brand.auth.auth.dto.LoginRequest;
import com.ceos.brand.auth.auth.dto.RegisterRequest;
import com.ceos.brand.auth.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        return authService.register(request, httpRequest.getSession(true));
    }

    @PostMapping("/login")
    public AuthUserResponse login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        return authService.login(request, httpRequest.getSession(true));
    }

    @GetMapping("/me")
    public AuthUserResponse me(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        return authService.getCurrentUser(session);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        authService.logout(session);
        return Map.of("message", "Sesion cerrada correctamente.");
    }
}
