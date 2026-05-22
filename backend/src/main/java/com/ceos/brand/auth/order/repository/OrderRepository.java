package com.ceos.brand.auth.order.repository;

import com.ceos.brand.auth.cart.model.CartItem;
import com.ceos.brand.auth.order.model.Order;
import com.ceos.brand.auth.order.model.OrderItem;
import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Order create(UserSnapshot user, List<CartItem> cartItems) {
        BigDecimal total = cartItems.stream()
            .map(item -> item.price().multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, user.id());
            statement.setBigDecimal(2, total);
            statement.setString(3, "Pagado");
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("No se pudo obtener el id del pedido.");
        }

        Long orderId = key.longValue();
        List<OrderItem> orderItems = cartItems.stream()
            .map(item -> new OrderItem(
                item.productId(),
                item.name(),
                item.imageUrl(),
                item.category(),
                item.size(),
                item.price(),
                item.quantity(),
                item.price().multiply(BigDecimal.valueOf(item.quantity()))
            ))
            .toList();

        for (CartItem item : cartItems) {
            BigDecimal lineTotal = item.price().multiply(BigDecimal.valueOf(item.quantity()));
            jdbcTemplate.update(
                """
                INSERT INTO order_items
                (order_id, product_id, product_name, product_image_url, product_category, product_size, unit_price, quantity, line_total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                orderId,
                item.productId(),
                item.name(),
                item.imageUrl(),
                item.category(),
                item.size(),
                item.price(),
                item.quantity(),
                lineTotal
            );
        }

        return new Order(
            orderId,
            user.id(),
            user.name(),
            user.email(),
            total,
            "Pagado",
            LocalDateTime.now(),
            orderItems
        );
    }

    public List<Order> findByUserId(Long userId) {
        List<Order> orders = jdbcTemplate.query(
            """
            SELECT o.id, o.user_id, u.name AS customer_name, u.email AS customer_email, o.total, o.status, o.created_at
            FROM orders o
            INNER JOIN users u ON u.id = o.user_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            """,
            (rs, rowNum) -> new Order(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getString("customer_name"),
                rs.getString("customer_email"),
                rs.getBigDecimal("total"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()
            ),
            userId
        );

        if (orders.isEmpty()) {
            return orders;
        }

        List<Long> orderIds = orders.stream().map(Order::id).toList();
        String placeholders = orderIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<OrderItemRow> itemRows = jdbcTemplate.query(
            """
            SELECT order_id, product_id, product_name, product_image_url, product_category, product_size, unit_price, quantity, line_total
            FROM order_items
            WHERE order_id IN (
            """ + placeholders + ") ORDER BY id ASC",
            (rs, rowNum) -> new OrderItemRow(
                rs.getLong("order_id"),
                new OrderItem(
                    rs.getLong("product_id"),
                    rs.getString("product_name"),
                    rs.getString("product_image_url"),
                    rs.getString("product_category"),
                    rs.getString("product_size"),
                    rs.getBigDecimal("unit_price"),
                    rs.getInt("quantity"),
                    rs.getBigDecimal("line_total")
                )
            ),
            orderIds.toArray()
        );

        Map<Long, List<OrderItem>> itemsByOrder = itemRows.stream()
            .collect(Collectors.groupingBy(OrderItemRow::orderId, Collectors.mapping(OrderItemRow::item, Collectors.toList())));

        return orders.stream()
            .map(order -> new Order(order.id(), order.userId(), order.customerName(), order.customerEmail(), order.total(), order.status(), order.createdAt(), itemsByOrder.getOrDefault(order.id(), List.of())))
            .toList();
    }

    public List<Order> findAll() {
        List<Order> orders = jdbcTemplate.query(
            """
            SELECT o.id, o.user_id, u.name AS customer_name, u.email AS customer_email, o.total, o.status, o.created_at
            FROM orders o
            INNER JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
            """,
            (rs, rowNum) -> new Order(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getString("customer_name"),
                rs.getString("customer_email"),
                rs.getBigDecimal("total"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                List.of()
            )
        );

        if (orders.isEmpty()) {
            return orders;
        }

        List<Long> orderIds = orders.stream().map(Order::id).toList();
        String placeholders = orderIds.stream().map(id -> "?").collect(Collectors.joining(","));
        List<OrderItemRow> itemRows = jdbcTemplate.query(
            """
            SELECT order_id, product_id, product_name, product_image_url, product_category, product_size, unit_price, quantity, line_total
            FROM order_items
            WHERE order_id IN (
            """ + placeholders + ") ORDER BY id ASC",
            (rs, rowNum) -> new OrderItemRow(
                rs.getLong("order_id"),
                new OrderItem(
                    rs.getLong("product_id"),
                    rs.getString("product_name"),
                    rs.getString("product_image_url"),
                    rs.getString("product_category"),
                    rs.getString("product_size"),
                    rs.getBigDecimal("unit_price"),
                    rs.getInt("quantity"),
                    rs.getBigDecimal("line_total")
                )
            ),
            orderIds.toArray()
        );

        Map<Long, List<OrderItem>> itemsByOrder = itemRows.stream()
            .collect(Collectors.groupingBy(OrderItemRow::orderId, Collectors.mapping(OrderItemRow::item, Collectors.toList())));

        return orders.stream()
            .map(order -> new Order(order.id(), order.userId(), order.customerName(), order.customerEmail(), order.total(), order.status(), order.createdAt(), itemsByOrder.getOrDefault(order.id(), List.of())))
            .toList();
    }

    private record OrderItemRow(Long orderId, OrderItem item) {
    }

    public record UserSnapshot(Long id, String name, String email) {
    }
}
