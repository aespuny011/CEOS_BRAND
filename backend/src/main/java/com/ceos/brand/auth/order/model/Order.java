package com.ceos.brand.auth.order.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record Order(
    Long id,
    Long userId,
    String customerName,
    String customerEmail,
    BigDecimal total,
    String status,
    LocalDateTime createdAt,
    List<OrderItem> items
) {
}
