import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CartItem } from '../../models/cart-item.model';
import { CartService } from '../../services/cart.service';

type PaymentControlName = 'cardName' | 'cardNumber' | 'cardExpiry' | 'cardCvv';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  checkoutMessage: string | null = null;
  paymentError: string | null = null;
  purchaseCompleted = false;
  paymentOpen = false;
  isProcessingPayment = false;
  items: CartItem[] = [];
  hasItems = false;
  totalItems = 0;
  totalPrice = 0;

  paymentForm = this.fb.group({
    cardName: ['', [Validators.required, Validators.minLength(3)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^(\d\s*){16}$/)]],
    cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  private cartSubscription?: Subscription;

  constructor(private cartService: CartService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.cartSubscription = this.cartService.cart$.subscribe((cart) => {
      this.items = cart.items;
      this.hasItems = cart.items.length > 0;
      this.totalItems = cart.totalItems;
      this.totalPrice = cart.totalPrice;
    });

    this.cartService.refresh().subscribe();
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  clearCart(): void {
    this.purchaseCompleted = false;
    this.closePayment();
    this.cartService.clear();
  }

  removeProduct(productId: number): void {
    this.purchaseCompleted = false;
    this.closePayment();
    this.cartService.removeProduct(productId);
  }

  changeQuantity(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const quantity = Number(input?.value);

    if (!Number.isFinite(quantity)) {
      return;
    }

    this.cartService.updateQuantity(productId, quantity);
  }

  openPayment(): void {
    if (!this.hasItems) {
      return;
    }

    this.checkoutMessage = null;
    this.paymentError = null;
    this.purchaseCompleted = false;
    this.paymentOpen = true;
  }

  closePayment(): void {
    if (this.isProcessingPayment) {
      return;
    }

    this.paymentOpen = false;
    this.paymentError = null;
  }

  submitPayment(): void {
    if (!this.hasItems || this.isProcessingPayment) {
      return;
    }

    this.checkoutMessage = null;
    this.paymentError = null;
    this.paymentForm.markAllAsTouched();

    if (this.paymentForm.invalid) {
      this.paymentError = 'Revisa los datos de la tarjeta para continuar.';
      return;
    }

    if (!this.isFutureExpiry(this.paymentForm.controls.cardExpiry.value ?? '')) {
      this.paymentError = 'La fecha de caducidad no es valida.';
      return;
    }

    this.isProcessingPayment = true;

    setTimeout(() => {
      this.cartService.checkout().subscribe({
        next: () => {
          this.checkoutMessage = 'Pago completado correctamente. Su pedido se pondra en proceso al instante.';
          this.purchaseCompleted = true;
          this.paymentOpen = false;
          this.paymentForm.reset();
          this.isProcessingPayment = false;
        },
        error: () => {
          this.paymentError = 'No se pudo terminar la compra. Revisa el stock e intentalo de nuevo.';
          this.isProcessingPayment = false;
        },
      });
    }, 900);
  }

  formatCardNumber(): void {
    const control = this.paymentForm.controls.cardNumber;
    const digits = (control.value ?? '').replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    control.setValue(formatted, { emitEvent: false });
  }

  formatExpiry(): void {
    const control = this.paymentForm.controls.cardExpiry;
    const digits = (control.value ?? '').replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    control.setValue(formatted, { emitEvent: false });
  }

  isInvalid(controlName: PaymentControlName): boolean {
    const control = this.paymentForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private isFutureExpiry(value: string): boolean {
    const [monthText, yearText] = value.split('/');
    const month = Number(monthText);
    const year = Number(`20${yearText}`);

    if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12) {
      return false;
    }

    const now = new Date();
    const expiryDate = new Date(year, month);
    return expiryDate > new Date(now.getFullYear(), now.getMonth());
  }
}
