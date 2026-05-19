package com.ceos.brand.auth.product.model;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record Product(
    Long id,
    String name,
    String category,
    BigDecimal price,
    String imageUrl,
    List<String> images,
    Map<String, Integer> sizeStock,
    String description,
    String status,
    Integer stock
) {
}
