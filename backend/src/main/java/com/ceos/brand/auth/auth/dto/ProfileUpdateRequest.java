package com.ceos.brand.auth.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
    @NotBlank(message = "El nombre es obligatorio.")
    @Size(min = 2, max = 120, message = "El nombre debe tener entre 2 y 120 caracteres.")
    String name,

    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "Introduce un email valido.")
    @Size(max = 190, message = "El email es demasiado largo.")
    String email
) {
}
