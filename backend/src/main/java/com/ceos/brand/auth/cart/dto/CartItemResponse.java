package com.ceos.brand.auth.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
    Long productId,
    String name,
    BigDecimal price,
    String imageUrl,
    String category,
    Integer quantity,
    Integer maxStock,
    BigDecimal lineTotal
) {
}
