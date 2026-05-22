package com.ceos.brand.auth.payment.controller;

import com.ceos.brand.auth.cart.dto.CartResponse;
import com.ceos.brand.auth.payment.dto.CheckoutSessionResponse;
import com.ceos.brand.auth.payment.dto.ConfirmPaymentRequest;
import com.ceos.brand.auth.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout-session")
    public CheckoutSessionResponse createCheckoutSession(HttpServletRequest request) {
        return paymentService.createCheckoutSession(request.getSession(false));
    }

    @PostMapping("/confirm")
    public CartResponse confirmPayment(
        @Valid @RequestBody ConfirmPaymentRequest paymentRequest,
        HttpServletRequest request
    ) {
        return paymentService.confirmPayment(request.getSession(false), paymentRequest.sessionId());
    }

    @PostMapping("/stripe/webhook")
    public ResponseEntity<Void> handleStripeWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String signatureHeader
    ) {
        paymentService.handleStripeWebhook(payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
