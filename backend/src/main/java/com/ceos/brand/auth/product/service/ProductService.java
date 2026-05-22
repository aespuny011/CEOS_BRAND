package com.ceos.brand.auth.product.service;

import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.repository.UserRepository;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.email.service.MarketingEmailService;
import com.ceos.brand.auth.product.dto.ProductSearchCriteria;
import com.ceos.brand.auth.product.dto.ProductRequest;
import com.ceos.brand.auth.product.dto.ProductResponse;
import com.ceos.brand.auth.product.model.Product;
import com.ceos.brand.auth.product.repository.ProductRepository;
import jakarta.servlet.http.HttpSession;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final MarketingEmailService marketingEmailService;

    public ProductService(
        ProductRepository productRepository,
        AuthService authService,
        UserRepository userRepository,
        MarketingEmailService marketingEmailService
    ) {
        this.productRepository = productRepository;
        this.authService = authService;
        this.userRepository = userRepository;
        this.marketingEmailService = marketingEmailService;
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
        notifyProductMarketingChange(current, updated);
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
        Map<String, Integer> sizeStock = cleanSizeStock(request.category(), request.sizeStock(), request.stock());
        return new Product(
            id,
            request.name().trim(),
            request.category().trim(),
            request.price(),
            request.imageUrl().trim(),
            cleanImages(request.images()),
            sizeStock,
            request.description().trim(),
            request.status().trim(),
            stockForProduct(request.category(), sizeStock, request.stock())
        );
    }

    private Product toProduct(Long id, ProductRequest request, Product current) {
        String imageUrl = isBlank(request.imageUrl()) ? current.imageUrl() : request.imageUrl().trim();
        List<String> images = cleanImages(request.images());

        if (images.isEmpty() && !isBlank(imageUrl)) {
            images = List.of(imageUrl);
        }

        Map<String, Integer> sizeStock = cleanSizeStock(request.category(), request.sizeStock(), request.stock());
        return new Product(
            id,
            request.name().trim(),
            request.category().trim(),
            request.price(),
            imageUrl,
            images,
            sizeStock,
            request.description().trim(),
            request.status().trim(),
            stockForProduct(request.category(), sizeStock, request.stock())
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
            availableSizesFor(product.category()),
            effectiveSizeStock(product.category(), product.sizeStock(), product.stock()),
            isPurchasable(product)
        );
    }

    private List<String> availableSizesFor(String category) {
        if ("Camiseta".equals(category) || "Sudadera".equals(category)) {
            return List.of("S", "M", "L", "XL");
        }

        if (category != null && category.startsWith("Pantal")) {
            return List.of("34", "36", "38", "40", "42", "44");
        }

        return List.of();
    }

    private Map<String, Integer> cleanSizeStock(String category, Map<String, Integer> requestedStock, Integer fallbackStock) {
        List<String> sizes = availableSizesFor(category);
        if (sizes.isEmpty()) {
            return Map.of();
        }

        Map<String, Integer> cleanStock = new LinkedHashMap<>();
        for (String size : sizes) {
            Integer value = requestedStock == null ? null : requestedStock.get(size);
            cleanStock.put(size, Math.max(0, value == null ? 0 : value));
        }

        if (totalStock(cleanStock) == 0 && fallbackStock != null && fallbackStock > 0) {
            return distributeStock(sizes, fallbackStock);
        }

        return cleanStock;
    }

    private Map<String, Integer> effectiveSizeStock(String category, Map<String, Integer> sizeStock, Integer totalStock) {
        List<String> sizes = availableSizesFor(category);
        if (sizes.isEmpty()) {
            return Map.of();
        }

        if (sizeStock != null && sizes.stream().anyMatch(size -> sizeStock.getOrDefault(size, 0) > 0)) {
            Map<String, Integer> ordered = new LinkedHashMap<>();
            for (String size : sizes) {
                ordered.put(size, Math.max(0, sizeStock.getOrDefault(size, 0)));
            }
            return ordered;
        }

        return distributeStock(sizes, totalStock == null ? 0 : totalStock);
    }

    private Map<String, Integer> distributeStock(List<String> sizes, Integer stock) {
        Map<String, Integer> distributed = new LinkedHashMap<>();
        int safeStock = Math.max(0, stock == null ? 0 : stock);
        int base = sizes.isEmpty() ? 0 : safeStock / sizes.size();
        int remainder = sizes.isEmpty() ? 0 : safeStock % sizes.size();
        for (int i = 0; i < sizes.size(); i++) {
            distributed.put(sizes.get(i), base + (i < remainder ? 1 : 0));
        }
        return distributed;
    }

    private int totalStock(Map<String, Integer> sizeStock) {
        return sizeStock == null ? 0 : sizeStock.values().stream().mapToInt(value -> Math.max(0, value == null ? 0 : value)).sum();
    }

    private int stockForProduct(String category, Map<String, Integer> sizeStock, Integer fallbackStock) {
        return availableSizesFor(category).isEmpty()
            ? Math.max(0, fallbackStock == null ? 0 : fallbackStock)
            : totalStock(sizeStock);
    }

    private boolean isPurchasable(Product product) {
        return "Activo".equals(product.status()) && product.stock() > 0;
    }

    private void notifyProductMarketingChange(Product current, Product updated) {
        boolean announcedAsComingSoon = !"Proximamente".equals(current.status()) && "Proximamente".equals(updated.status());
        boolean launchedFromComingSoon = "Proximamente".equals(current.status()) && isPurchasable(updated);
        boolean restocked = "Activo".equals(current.status()) && current.stock() <= 0 && isPurchasable(updated);

        if (!announcedAsComingSoon && !launchedFromComingSoon && !restocked) {
            LOGGER.info(
                "Product marketing email not triggered for product {}. Previous status/stock: {}/{}. New status/stock: {}/{}.",
                updated.id(),
                current.status(),
                current.stock(),
                updated.status(),
                updated.stock()
            );
            return;
        }

        List<User> recipients = userRepository.findAll();

        if (announcedAsComingSoon) {
            LOGGER.info("Product {} was announced as coming soon. Preparing announcement email for {} registered users.", updated.id(), recipients.size());
            marketingEmailService.sendProductAnnouncedEmail(updated, recipients);
            return;
        }

        if (launchedFromComingSoon) {
            LOGGER.info("Product {} launched from coming soon. Preparing launch email for {} registered users.", updated.id(), recipients.size());
            marketingEmailService.sendProductLaunchedEmail(updated, recipients);
            return;
        }

        LOGGER.info("Product {} was restocked. Preparing restock email for {} registered users.", updated.id(), recipients.size());
        marketingEmailService.sendProductRestockedEmail(updated, recipients);
    }
}
