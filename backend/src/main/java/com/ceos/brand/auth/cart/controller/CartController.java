package com.ceos.brand.auth.cart.controller;

import com.ceos.brand.auth.cart.dto.CartAddRequest;
import com.ceos.brand.auth.cart.dto.CartResponse;
import com.ceos.brand.auth.cart.dto.CartUpdateRequest;
import com.ceos.brand.auth.cart.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart(HttpServletRequest request) {
        return cartService.getCart(request.getSession(false));
    }

    @PostMapping("/items")
    public CartResponse addItem(
        @Valid @RequestBody CartAddRequest cartRequest,
        HttpServletRequest request
    ) {
        return cartService.add(request.getSession(false), cartRequest.productId(), cartRequest.quantity());
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateItem(
        @PathVariable Long productId,
        @Valid @RequestBody CartUpdateRequest cartRequest,
        HttpServletRequest request
    ) {
        return cartService.update(request.getSession(false), productId, cartRequest.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@PathVariable Long productId, HttpServletRequest request) {
        return cartService.remove(request.getSession(false), productId);
    }

    @DeleteMapping
    public CartResponse clear(HttpServletRequest request) {
        return cartService.clear(request.getSession(false));
    }

    @PostMapping("/checkout")
    public CartResponse checkout(HttpServletRequest request) {
        return cartService.checkout(request.getSession(false));
    }
}
