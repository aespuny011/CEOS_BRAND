package com.ceos.brand.auth.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres.")
    String name,

    @NotBlank(message = "El email es obligatorio.")
    @Email(message = "El email no es valido.")
    @Size(max = 120, message = "El email no puede superar 120 caracteres.")
    String email,

    @NotBlank(message = "El asunto es obligatorio.")
    @Size(max = 120, message = "El asunto no puede superar 120 caracteres.")
    String subject,

    @NotBlank(message = "El mensaje es obligatorio.")
    @Size(max = 2000, message = "El mensaje no puede superar 2000 caracteres.")
    String message
) {}
