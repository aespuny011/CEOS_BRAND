package com.ceos.brand.auth.product.dto;

import java.math.BigDecimal;

public record ProductSearchCriteria(
    String category,
    String status,
    String stock,
    BigDecimal minPrice,
    BigDecimal maxPrice
) {
}
