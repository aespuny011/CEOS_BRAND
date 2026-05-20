package com.ceos.brand.auth.order.model;

import java.math.BigDecimal;

public record OrderItem(
    Long productId,
    String productName,
    String productImageUrl,
    String productCategory,
    String productSize,
    BigDecimal unitPrice,
    Integer quantity,
    BigDecimal lineTotal
) {
}
