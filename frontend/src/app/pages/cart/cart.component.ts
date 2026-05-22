import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartItem } from '../../models/cart-item.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  checkoutMessage: string | null = null;
  paymentError: string | null = null;
  purchaseCompleted = false;
  isProcessingPayment = false;
  items: CartItem[] = [];
  hasItems = false;
  totalItems = 0;
  totalPrice = 0;

  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
      this.items = cart.items;
      this.hasItems = cart.items.length > 0;
      this.totalItems = cart.totalItems;
      this.totalPrice = cart.totalPrice;
    });

    this.cartService.refresh().subscribe();
    this.handleStripeReturn();
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  clearCart(): void {
    this.purchaseCompleted = false;
    this.cartService.clear();
  }

  removeProduct(productId: number, size = ''): void {
    this.purchaseCompleted = false;
    this.cartService.removeProduct(productId, size);
  }

  changeQuantity(productId: number, size: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const quantity = Number(input?.value);

    if (!Number.isFinite(quantity)) {
      return;
    }

    this.cartService.updateQuantity(productId, quantity, size);
  }

  startStripeCheckout(): void {
    if (!this.hasItems || this.isProcessingPayment) {
      return;
    }

    this.checkoutMessage = null;
    this.paymentError = null;
    this.purchaseCompleted = false;
    this.isProcessingPayment = true;

    this.cartService.createCheckoutSession().subscribe({
      next: (session) => {
        window.location.href = session.url;
      },
      error: (error: HttpErrorResponse) => {
        this.paymentError = error.error?.message ?? 'No se pudo iniciar el pago con Stripe. Revisa la configuracion e intentalo de nuevo.';
        this.isProcessingPayment = false;
      },
    });
  }

  private handleStripeReturn(): void {
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (paymentStatus === 'cancelled') {
      this.paymentError = 'Pago cancelado. Tu carrito sigue guardado.';
      this.clearPaymentQueryParams();
      return;
    }

    if (paymentStatus !== 'success' || !sessionId) {
      return;
    }

    this.isProcessingPayment = true;
    this.cartService.confirmStripePayment(sessionId).subscribe({
      next: () => {
        this.checkoutMessage = 'Pago completado correctamente. Tu pedido se pondra en proceso al instante.';
        this.purchaseCompleted = true;
        this.isProcessingPayment = false;
        this.clearPaymentQueryParams();
      },
      error: (error: HttpErrorResponse) => {
        this.paymentError = error.error?.message ?? 'Stripe recibio la vuelta, pero no se pudo confirmar el pedido. Revisa el stock o intentalo de nuevo.';
        this.isProcessingPayment = false;
        this.clearPaymentQueryParams();
      },
    });
  }

  private clearPaymentQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }
}
