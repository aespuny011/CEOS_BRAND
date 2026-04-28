package com.ceos.brand.auth.auth.model;

public record User(
    Long id,
    String name,
    String email,
    String passwordHash
) {
}
