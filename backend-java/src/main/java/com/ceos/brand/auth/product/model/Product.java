package com.ceos.brand.auth.product.model;

import java.math.BigDecimal;
import java.util.List;

public record Product(
    Long id,
    String name,
    String category,
    BigDecimal price,
    String imageUrl,
    List<String> images,
    String description,
    String status,
    Integer stock
) {
}
