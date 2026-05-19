package com.ceos.brand.auth.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
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
