package com.ceos.brand.auth.payment.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.cart.dto.CartResponse;
import com.ceos.brand.auth.cart.model.CartItem;
import com.ceos.brand.auth.cart.repository.CartRepository;
import com.ceos.brand.auth.cart.service.CartService;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.payment.dto.CheckoutSessionResponse;
import com.ceos.brand.auth.payment.repository.StripeCheckoutSessionRepository;
import com.stripe.Stripe;
import com.stripe.exception.AuthenticationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final AuthService authService;
    private final CartRepository cartRepository;
    private final CartService cartService;
    private final StripeCheckoutSessionRepository stripeCheckoutSessionRepository;
    private final String frontendBaseUrl;
    private final String stripeSecretKey;
    private final String stripeWebhookSecret;

    public PaymentService(
        AuthService authService,
        CartRepository cartRepository,
        CartService cartService,
        StripeCheckoutSessionRepository stripeCheckoutSessionRepository,
        @Value("${ceos.frontend.base-url}") String frontendBaseUrl,
        @Value("${stripe.secret-key}") String stripeSecretKey,
        @Value("${stripe.webhook-secret}") String stripeWebhookSecret
    ) {
        this.authService = authService;
        this.cartRepository = cartRepository;
        this.cartService = cartService;
        this.stripeCheckoutSessionRepository = stripeCheckoutSessionRepository;
        this.frontendBaseUrl = trimTrailingSlash(frontendBaseUrl);
        this.stripeSecretKey = stripeSecretKey;
        this.stripeWebhookSecret = stripeWebhookSecret;
    }

    public CheckoutSessionResponse createCheckoutSession(HttpSession session) {
        User user = authService.getCurrentUserEntity(session);
        List<CartItem> items = cartRepository.findByUserId(user.id());

        if (items.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El carrito esta vacio.");
        }

        configureStripe();

        SessionCreateParams.Builder params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl(frontendBaseUrl + "/carrito?payment=success&session_id={CHECKOUT_SESSION_ID}")
            .setCancelUrl(frontendBaseUrl + "/carrito?payment=cancelled")
            .putMetadata("user_id", user.id().toString())
            .setCustomerEmail(user.email());

        for (CartItem item : items) {
            params.addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setQuantity(item.quantity().longValue())
                    .setPriceData(
                        SessionCreateParams.LineItem.PriceData.builder()
                            .setCurrency("eur")
                            .setUnitAmount(toCents(item.price()))
                            .setProductData(
                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                    .setName(productName(item))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            );
        }

        try {
            Session stripeSession = Session.create(params.build());
            stripeCheckoutSessionRepository.savePending(stripeSession.getId(), user.id());
            return new CheckoutSessionResponse(stripeSession.getUrl());
        } catch (AuthenticationException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "La clave secreta de Stripe no es valida. Revisa STRIPE_SECRET_KEY.");
        } catch (StripeException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Stripe no pudo iniciar el pago.");
        }
    }

    public CartResponse confirmPayment(HttpSession session, String sessionId) {
        User user = authService.getCurrentUserEntity(session);
        configureStripe();

        try {
            Session stripeSession = Session.retrieve(sessionId);
            String stripeUserId = stripeSession.getMetadata().get("user_id");

            if (!user.id().toString().equals(stripeUserId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Este pago no pertenece a tu cuenta.");
            }

            fulfillPaidCheckout(stripeSession);
            return cartService.getCart(session);
        } catch (ApiException exception) {
            throw exception;
        } catch (StripeException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo verificar el pago con Stripe.");
        }
    }

    public void handleStripeWebhook(String payload, String signatureHeader) {
        configureStripe();

        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Configura STRIPE_WEBHOOK_SECRET para validar webhooks de Stripe.");
        }

        try {
            Event event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);

            if (!"checkout.session.completed".equals(event.getType())) {
                return;
            }

            StripeObject stripeObject = event.getDataObjectDeserializer().getObject()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Stripe no envio una sesion de checkout valida."));
            Session stripeSession = stripeObject instanceof Session session
                ? session
                : null;

            if (stripeSession == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "El webhook no contiene una sesion de checkout.");
            }

            fulfillPaidCheckout(stripeSession);
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No se pudo validar el webhook de Stripe.");
        }
    }

    private void fulfillPaidCheckout(Session stripeSession) {
        if (!"paid".equals(stripeSession.getPaymentStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El pago todavia no esta confirmado.");
        }

        Long userId = Long.valueOf(stripeSession.getMetadata().get("user_id"));

        if (stripeCheckoutSessionRepository.isCompleted(stripeSession.getId())) {
            return;
        }

        if (!stripeCheckoutSessionRepository.tryMarkProcessing(stripeSession.getId(), userId)) {
            return;
        }

        try {
            cartService.checkoutPaidCartForUser(userId);
            stripeCheckoutSessionRepository.markCompleted(stripeSession.getId());
        } catch (RuntimeException exception) {
            stripeCheckoutSessionRepository.markFailed(stripeSession.getId());
            throw exception;
        }
    }

    private void configureStripe() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Configura STRIPE_SECRET_KEY para activar pagos reales.");
        }

        if (!stripeSecretKey.startsWith("sk_") || stripeSecretKey.contains("...")) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "STRIPE_SECRET_KEY debe ser la clave secreta completa de Stripe, no un placeholder.");
        }

        Stripe.apiKey = stripeSecretKey;
    }

    private Long toCents(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
            .setScale(0, RoundingMode.HALF_UP)
            .longValueExact();
    }

    private String productName(CartItem item) {
        return item.size() == null || item.size().isBlank()
            ? item.name()
            : item.name() + " - Talla " + item.size();
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:4200";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
