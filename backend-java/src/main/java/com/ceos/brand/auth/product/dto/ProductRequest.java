package com.ceos.brand.auth.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
    @NotBlank(message = "El nombre es obligatorio.")
    String name,
    @NotBlank(message = "La categoria es obligatoria.")
    String category,
    @NotNull(message = "El precio es obligatorio.")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor que 0.")
    BigDecimal price,
    @NotBlank(message = "La imagen principal es obligatoria.")
    String imageUrl,
    @NotNull(message = "Las imagenes son obligatorias.")
    List<String> images,
    @NotBlank(message = "La descripcion es obligatoria.")
    String description,
    @NotBlank(message = "El estado es obligatorio.")
    String status,
    @NotNull(message = "El stock es obligatorio.")
    @Min(value = 0, message = "El stock no puede ser negativo.")
    Integer stock
) {
}
