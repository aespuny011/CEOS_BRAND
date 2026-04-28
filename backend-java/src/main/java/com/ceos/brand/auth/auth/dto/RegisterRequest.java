package com.ceos.brand.auth.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "El nombre es obligatorio.")
    String name,
    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "El email no es valido.")
    String email,
    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres.")
    String password
) {
}
