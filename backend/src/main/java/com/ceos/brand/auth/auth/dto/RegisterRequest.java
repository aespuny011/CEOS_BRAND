package com.ceos.brand.auth.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "El nombre es obligatorio.")
    String name,
    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "El email no es valido.")
    String email,
    @NotBlank(message = "La contrasena es obligatoria.")
    @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres.")
    @Pattern(regexp = ".*[A-Z].*", message = "La contrasena debe incluir al menos una letra mayuscula.")
    @Pattern(regexp = ".*[a-z].*", message = "La contrasena debe incluir al menos una letra minuscula.")
    @Pattern(regexp = ".*\\d.*", message = "La contrasena debe incluir al menos un numero.")
    @Pattern(regexp = ".*[^A-Za-z0-9\\s].*", message = "La contrasena debe incluir al menos un simbolo.")
    @Pattern(regexp = "^\\S+$", message = "La contrasena no puede contener espacios.")
    String password
) {
}
