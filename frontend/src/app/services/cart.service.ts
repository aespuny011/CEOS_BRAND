import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'ceos-cart';
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadItems());

  readonly items$ = this.itemsSubject.asObservable();

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get totalItems(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalPrice(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  addProduct(product: Product, quantity = 1): void {
    if (!this.canPurchase(product) || quantity <= 0) {
      return;
    }

    const items = [...this.items];
    const existingItem = items.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, product.stock);
      existingItem.maxStock = product.stock;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        quantity: Math.min(quantity, product.stock),
        maxStock: product.stock,
      });
    }

    this.updateItems(items);
  }

  updateQuantity(productId: number, quantity: number): void {
    const items = this.items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
          : item
      )
      .filter((item) => item.quantity > 0);

    this.updateItems(items);
  }

  removeProduct(productId: number): void {
    this.updateItems(this.items.filter((item) => item.productId !== productId));
  }

  clear(): void {
    this.updateItems([]);
  }

  private updateItems(items: CartItem[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private loadItems(): CartItem[] {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private canPurchase(product: Product): boolean {
    return product.status === 'Activo' && product.stock > 0;
  }
}
