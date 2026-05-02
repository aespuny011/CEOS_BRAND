package com.ceos.brand.auth.auth.dto;

public record AuthUserResponse(
    Long id,
    String name,
    String email,
    String role,
    boolean isAdmin
) {
}
