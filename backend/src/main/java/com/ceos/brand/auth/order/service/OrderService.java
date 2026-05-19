package com.ceos.brand.auth.order.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.order.dto.OrderItemResponse;
import com.ceos.brand.auth.order.dto.OrderResponse;
import com.ceos.brand.auth.order.model.Order;
import com.ceos.brand.auth.order.model.OrderItem;
import com.ceos.brand.auth.order.repository.OrderRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final AuthService authService;
    private final OrderRepository orderRepository;

    public OrderService(AuthService authService, OrderRepository orderRepository) {
        this.authService = authService;
        this.orderRepository = orderRepository;
    }

    public List<OrderResponse> getMyOrders(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        return orderRepository.findByUserId(user.id()).stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> getAllOrders(HttpSession session) {
        authService.requireAdmin(session);
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
            order.id(),
            order.userId(),
            order.customerName(),
            order.customerEmail(),
            order.total(),
            order.status(),
            order.createdAt(),
            order.items().stream().map(this::toItemResponse).toList()
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
            item.productId(),
            item.productName(),
            item.productImageUrl(),
            item.productCategory(),
            item.productSize(),
            item.unitPrice(),
            item.quantity(),
            item.lineTotal()
        );
    }
}
