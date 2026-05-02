package com.ceos.brand.auth.product.service;

import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.product.dto.ProductSearchCriteria;
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

    public List<ProductResponse> getProducts(HttpSession session, ProductSearchCriteria criteria) {
        User user = authService.getCurrentUserEntity(session);
        boolean admin = authService.isAdmin(user);
        List<Product> products = productRepository.search(
            admin,
            criteria.category(),
            criteria.status(),
            criteria.stock(),
            criteria.minPrice(),
            criteria.maxPrice()
        );

        return products.stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> getFeaturedProducts() {
        return productRepository.findFeatured(4).stream().map(this::toResponse).toList();
    }

    public ProductResponse getProductById(Long id, HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        return (authService.isAdmin(user) ? productRepository.findById(id) : productRepository.findVisibleById(id))
            .map(this::toResponse)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
    }

    public ProductResponse create(ProductRequest request, HttpSession session) {
        authService.requireAdmin(session);
        if (isBlank(request.imageUrl())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La imagen principal es obligatoria.");
        }

        Product created = productRepository.create(toProduct(null, request));
        return toResponse(created);
    }

    public ProductResponse update(Long id, ProductRequest request, HttpSession session) {
        authService.requireAdmin(session);
        Product current = productRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));

        Product updated = productRepository.update(id, toProduct(id, request, current));
        return toResponse(updated);
    }

    public boolean delete(Long id, HttpSession session) {
        authService.requireAdmin(session);
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
            cleanImages(request.images()),
            request.description().trim(),
            request.status().trim(),
            request.stock()
        );
    }

    private Product toProduct(Long id, ProductRequest request, Product current) {
        String imageUrl = isBlank(request.imageUrl()) ? current.imageUrl() : request.imageUrl().trim();
        List<String> images = cleanImages(request.images());

        if (images.isEmpty() && !isBlank(imageUrl)) {
            images = List.of(imageUrl);
        }

        return new Product(
            id,
            request.name().trim(),
            request.category().trim(),
            request.price(),
            imageUrl,
            images,
            request.description().trim(),
            request.status().trim(),
            request.stock()
        );
    }

    private List<String> cleanImages(List<String> images) {
        return images == null ? List.of() : images.stream().map(String::trim).filter(value -> !value.isBlank()).toList();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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
            product.stock(),
            isPurchasable(product)
        );
    }

    private boolean isPurchasable(Product product) {
        return "Activo".equals(product.status()) && product.stock() > 0;
    }
}
