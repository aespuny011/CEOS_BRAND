package com.ceos.brand.auth.cart.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.cart.dto.CartItemResponse;
import com.ceos.brand.auth.cart.dto.CartResponse;
import com.ceos.brand.auth.cart.model.CartItem;
import com.ceos.brand.auth.cart.repository.CartRepository;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.product.model.Product;
import com.ceos.brand.auth.product.repository.ProductRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final AuthService authService;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartService(
        AuthService authService,
        CartRepository cartRepository,
        ProductRepository productRepository
    ) {
        this.authService = authService;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    public CartResponse getCart(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        return toResponse(cartRepository.findByUserId(user.id()));
    }

    public CartResponse add(HttpSession session, Long productId, Integer quantity) {
        User user = authService.getCurrentUserEntity(session);
        Product product = getPurchasableProduct(productId);
        int currentQuantity = cartRepository.findQuantity(user.id(), productId);
        int nextQuantity = Math.min(currentQuantity + quantity, product.stock());
        cartRepository.upsert(user.id(), productId, nextQuantity);
        return getCart(session);
    }

    public CartResponse update(HttpSession session, Long productId, Integer quantity) {
        User user = authService.getCurrentUserEntity(session);
        Product product = getPurchasableProduct(productId);
        cartRepository.upsert(user.id(), productId, Math.min(quantity, product.stock()));
        return getCart(session);
    }

    public CartResponse remove(HttpSession session, Long productId) {
        User user = authService.getCurrentUserEntity(session);
        cartRepository.remove(user.id(), productId);
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
            if (!isPurchasable(item.status(), item.stock())) {
                throw new ApiException(HttpStatus.CONFLICT, "El producto " + item.name() + " ya no esta disponible.");
            }

            if (item.quantity() > item.stock()) {
                throw new ApiException(HttpStatus.CONFLICT, "No hay stock suficiente de " + item.name() + ".");
            }

            int updated = productRepository.decreaseStock(item.productId(), item.quantity());
            if (updated == 0) {
                throw new ApiException(HttpStatus.CONFLICT, "No hay stock suficiente de " + item.name() + ".");
            }
        }

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
        int quantity = Math.min(item.quantity(), item.stock());
        BigDecimal lineTotal = item.price().multiply(BigDecimal.valueOf(quantity));
        return new CartItemResponse(
            item.productId(),
            item.name(),
            item.price(),
            item.imageUrl(),
            item.category(),
            quantity,
            item.stock(),
            lineTotal
        );
    }

    private boolean isPurchasable(String status, int stock) {
        return "Activo".equals(status) && stock > 0;
    }
}
