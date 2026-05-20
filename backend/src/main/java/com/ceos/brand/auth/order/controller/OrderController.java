package com.ceos.brand.auth.order.controller;

import com.ceos.brand.auth.order.dto.OrderResponse;
import com.ceos.brand.auth.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/me")
    public List<OrderResponse> getMyOrders(HttpServletRequest request) {
        return orderService.getMyOrders(request.getSession(false));
    }

    @GetMapping
    public List<OrderResponse> getAllOrders(HttpServletRequest request) {
        return orderService.getAllOrders(request.getSession(false));
    }
}
