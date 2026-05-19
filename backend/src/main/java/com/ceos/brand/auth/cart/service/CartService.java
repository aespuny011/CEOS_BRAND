package com.ceos.brand.auth.cart.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.cart.dto.CartItemResponse;
import com.ceos.brand.auth.cart.dto.CartResponse;
import com.ceos.brand.auth.cart.model.CartItem;
import com.ceos.brand.auth.cart.repository.CartRepository;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.order.repository.OrderRepository;
import com.ceos.brand.auth.product.model.Product;
import com.ceos.brand.auth.product.repository.ProductRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final AuthService authService;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public CartService(
        AuthService authService,
        CartRepository cartRepository,
        OrderRepository orderRepository,
        ProductRepository productRepository
    ) {
        this.authService = authService;
        this.cartRepository = cartRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public CartResponse getCart(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        return toResponse(cartRepository.findByUserId(user.id()));
    }

    public CartResponse add(HttpSession session, Long productId, Integer quantity, String size) {
        User user = authService.getCurrentUserEntity(session);
        Product product = getPurchasableProduct(productId);
        String selectedSize = normalizeSize(product, size);
        int currentQuantity = cartRepository.findQuantity(user.id(), productId, selectedSize);
        int nextQuantity = Math.min(currentQuantity + quantity, stockForSize(product, selectedSize));
        cartRepository.upsert(user.id(), productId, nextQuantity, selectedSize);
        return getCart(session);
    }

    public CartResponse update(HttpSession session, Long productId, Integer quantity, String size) {
        User user = authService.getCurrentUserEntity(session);
        Product product = getPurchasableProduct(productId);
        String selectedSize = normalizeSize(product, size);
        cartRepository.upsert(user.id(), productId, Math.min(quantity, stockForSize(product, selectedSize)), selectedSize);
        return getCart(session);
    }

    public CartResponse remove(HttpSession session, Long productId, String size) {
        User user = authService.getCurrentUserEntity(session);
        cartRepository.remove(user.id(), productId, normalizeRawSize(size));
        return getCart(session);
    }

    public CartResponse clear(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        cartRepository.clear(user.id());
        return getCart(session);
    }

    @Transactional
    public CartResponse checkout(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        List<CartItem> items = cartRepository.findByUserId(user.id());

        if (items.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El carrito esta vacio.");
        }

        for (CartItem item : items) {
            Product product = productRepository.findById(item.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
            int sizeStock = stockForSize(product, item.size());

            if (!isPurchasable(item.status(), sizeStock)) {
                throw new ApiException(HttpStatus.CONFLICT, "El producto " + item.name() + " ya no esta disponible.");
            }

            if (item.quantity() > sizeStock) {
                throw new ApiException(HttpStatus.CONFLICT, "No hay stock suficiente de " + item.name() + ".");
            }

            Map<String, Integer> nextSizeStock = new LinkedHashMap<>(effectiveSizeStock(product));
            nextSizeStock.put(item.size(), sizeStock - item.quantity());
            int updated = productRepository.updateStock(item.productId(), nextSizeStock, totalStock(nextSizeStock));
            if (updated == 0) {
                throw new ApiException(HttpStatus.CONFLICT, "No hay stock suficiente de " + item.name() + ".");
            }
        }

        orderRepository.create(user.id(), items);
        cartRepository.clear(user.id());
        return toResponse(List.of());
    }

    private Product getPurchasableProduct(Long productId) {
        Product product = productRepository.findVisibleById(productId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado."));

        if (!isPurchasable(product.status(), product.stock())) {
            throw new ApiException(HttpStatus.CONFLICT, "Este producto no esta disponible para comprar.");
        }

        return product;
    }

    private CartResponse toResponse(List<CartItem> items) {
        List<CartItemResponse> responseItems = items.stream().map(this::toItemResponse).toList();
        int totalItems = responseItems.stream().mapToInt(CartItemResponse::quantity).sum();
        BigDecimal totalPrice = responseItems.stream()
            .map(CartItemResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(responseItems, totalItems, totalPrice);
    }

    private CartItemResponse toItemResponse(CartItem item) {
        Product product = productRepository.findById(item.productId()).orElse(null);
        int maxStock = product == null ? item.stock() : stockForSize(product, item.size());
        int quantity = Math.min(item.quantity(), maxStock);
        BigDecimal lineTotal = item.price().multiply(BigDecimal.valueOf(quantity));
        return new CartItemResponse(
            item.productId(),
            item.name(),
            item.price(),
            item.imageUrl(),
            item.category(),
            item.size(),
            quantity,
            maxStock,
            lineTotal
        );
    }

    private String normalizeSize(Product product, String size) {
        List<String> availableSizes = availableSizesFor(product.category());
        if (availableSizes.isEmpty()) {
            return "";
        }

        String normalized = normalizeRawSize(size);
        if (!availableSizes.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecciona una talla valida.");
        }

        return normalized;
    }

    private String normalizeRawSize(String size) {
        return size == null ? "" : size.trim().toUpperCase();
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

    private int stockForSize(Product product, String size) {
        List<String> sizes = availableSizesFor(product.category());
        if (sizes.isEmpty()) {
            return product.stock();
        }

        return effectiveSizeStock(product).getOrDefault(size, 0);
    }

    private Map<String, Integer> effectiveSizeStock(Product product) {
        List<String> sizes = availableSizesFor(product.category());
        if (sizes.isEmpty()) {
            return Map.of();
        }

        Map<String, Integer> current = product.sizeStock();
        if (current != null && sizes.stream().anyMatch(size -> current.getOrDefault(size, 0) > 0)) {
            Map<String, Integer> ordered = new LinkedHashMap<>();
            for (String size : sizes) {
                ordered.put(size, Math.max(0, current.getOrDefault(size, 0)));
            }
            return ordered;
        }

        Map<String, Integer> distributed = new LinkedHashMap<>();
        int base = product.stock() / sizes.size();
        int remainder = product.stock() % sizes.size();
        for (int i = 0; i < sizes.size(); i++) {
            distributed.put(sizes.get(i), base + (i < remainder ? 1 : 0));
        }
        return distributed;
    }

    private int totalStock(Map<String, Integer> sizeStock) {
        return sizeStock.values().stream().mapToInt(value -> Math.max(0, value == null ? 0 : value)).sum();
    }

    private boolean isPurchasable(String status, int stock) {
        return "Activo".equals(status) && stock > 0;
    }
}
