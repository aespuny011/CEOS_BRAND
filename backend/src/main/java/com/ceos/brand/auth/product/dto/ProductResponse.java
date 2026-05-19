package com.ceos.brand.auth.product.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductResponse(
    Long id,
    String name,
    String category,
    BigDecimal price,
    String imageUrl,
    List<String> images,
    String description,
    String status,
    Integer stock,
    List<String> availableSizes,
    Map<String, Integer> sizeStock,
    boolean purchasable
) {
}
