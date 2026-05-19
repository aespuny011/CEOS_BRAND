package com.ceos.brand.auth.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    Long userId,
    String customerName,
    String customerEmail,
    BigDecimal total,
    String status,
    LocalDateTime createdAt,
    List<OrderItemResponse> items
) {
}
