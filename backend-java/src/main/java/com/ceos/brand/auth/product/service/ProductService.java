package com.ceos.brand.auth.product.service;

import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.product.dto.ProductRequest;
import com.ceos.brand.auth.product.dto.ProductResponse;
import com.ceos.brand.auth.product.model.Product;
import com.ceos.brand.auth.product.repository.ProductRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final AuthService authService;

    public ProductService(ProductRepository productRepository, AuthService authService) {
        this.productRepository = productRepository;
        this.authService = authService;
    }

    public List<ProductResponse> getProducts(HttpSession session) {
        authService.getCurrentUser(session);
        return productRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ProductResponse getProductById(Long id, HttpSession session) {
        authService.getCurrentUser(session);
        return productRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
    }

    public ProductResponse create(ProductRequest request, HttpSession session) {
        authService.getCurrentUser(session);
        Product created = productRepository.create(toProduct(null, request));
        return toResponse(created);
    }

    public ProductResponse update(Long id, ProductRequest request, HttpSession session) {
        authService.getCurrentUser(session);
        productRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));

        Product updated = productRepository.update(id, toProduct(id, request));
        return toResponse(updated);
    }

    public boolean delete(Long id, HttpSession session) {
        authService.getCurrentUser(session);
        boolean deleted = productRepository.delete(id);
        if (!deleted) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado.");
        }

        return true;
    }

    private Product toProduct(Long id, ProductRequest request) {
        return new Product(
            id,
            request.name().trim(),
            request.category().trim(),
            request.price(),
            request.imageUrl().trim(),
            request.images() == null ? List.of() : request.images().stream().map(String::trim).filter(value -> !value.isBlank()).toList(),
            request.description().trim(),
            request.status().trim(),
            request.stock()
        );
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
            product.id(),
            product.name(),
            product.category(),
            product.price(),
            product.imageUrl(),
            product.images(),
            product.description(),
            product.status(),
            product.stock()
        );
    }
}
