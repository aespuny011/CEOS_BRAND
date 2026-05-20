package com.ceos.brand.auth.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmPaymentRequest(
    @NotBlank String sessionId
) {
}
