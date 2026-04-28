import { Component } from '@angular/core';

import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  checkoutMessage: string | null = null;

  constructor(public cartService: CartService) {}

  changeQuantity(productId: number, value: string): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity)) {
      return;
    }

    this.cartService.updateQuantity(productId, quantity);
  }

  finalizePurchase(): void {
    if (!this.cartService.items.length) {
      return;
    }

    this.checkoutMessage =
      'Pedido preparado. Cuando añadamos pago real y stock en backend, este carrito se convertira en checkout.';
    this.cartService.clear();
  }
}
