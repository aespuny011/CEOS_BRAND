package com.ceos.brand.auth.product.controller;

import com.ceos.brand.auth.product.dto.ProductRequest;
import com.ceos.brand.auth.product.dto.ProductResponse;
import com.ceos.brand.auth.product.dto.ProductSearchCriteria;
import com.ceos.brand.auth.product.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getProducts(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String stock,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        HttpServletRequest request
    ) {
        ProductSearchCriteria criteria = new ProductSearchCriteria(category, status, stock, minPrice, maxPrice);
        return productService.getProducts(request.getSession(false), criteria);
    }

    @GetMapping("/featured")
    public List<ProductResponse> getFeaturedProducts() {
        return productService.getFeaturedProducts();
    }

    @GetMapping("/{id}")
    public ProductResponse getProductById(@PathVariable Long id, HttpServletRequest request) {
        return productService.getProductById(id, request.getSession(false));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(
        @Valid @RequestBody ProductRequest productRequest,
        HttpServletRequest request
    ) {
        return productService.create(productRequest, request.getSession(false));
    }

    @PutMapping("/{id}")
    public ProductResponse update(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest productRequest,
        HttpServletRequest request
    ) {
        return productService.update(id, productRequest, request.getSession(false));
    }

    @DeleteMapping("/{id}")
    public boolean delete(@PathVariable Long id, HttpServletRequest request) {
        return productService.delete(id, request.getSession(false));
    }
}
