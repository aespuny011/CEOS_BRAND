package com.ceos.brand.auth.cart.model;

import java.math.BigDecimal;

public record CartItem(
    Long productId,
    String name,
    BigDecimal price,
    String imageUrl,
    String category,
    String status,
    Integer quantity,
    Integer stock
) {
}
