import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { Cart, CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiUrl = 'http://localhost:8080/api/cart';
  private readonly emptyCart: Cart = { items: [], totalItems: 0, totalPrice: 0 };
  private readonly cartSubject = new BehaviorSubject<Cart>(this.emptyCart);

  readonly cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  get cart(): Cart {
    return this.cartSubject.value;
  }

  get items(): CartItem[] {
    return this.cart.items;
  }

  get totalItems(): number {
    return this.cart.totalItems;
  }

  get totalPrice(): number {
    return this.cart.totalPrice;
  }

  refresh(): Observable<boolean> {
    return this.http.get<Cart>(this.apiUrl, { withCredentials: true }).pipe(
      tap((cart) => this.cartSubject.next(cart)),
      map(() => true),
      catchError(() => {
        this.cartSubject.next(this.emptyCart);
        return of(false);
      })
    );
  }

  addProduct(product: Product, quantity = 1): void {
    if (!product.purchasable || quantity <= 0) {
      return;
    }

    this.http
      .post<Cart>(
        `${this.apiUrl}/items`,
        { productId: product.id, quantity },
        { withCredentials: true }
      )
      .subscribe((cart) => this.cartSubject.next(cart));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (!Number.isFinite(quantity)) {
      return;
    }

    this.http
      .put<Cart>(
        `${this.apiUrl}/items/${productId}`,
        { quantity: Math.max(1, quantity) },
        { withCredentials: true }
      )
      .subscribe((cart) => this.cartSubject.next(cart));
  }

  removeProduct(productId: number): void {
    this.http
      .delete<Cart>(`${this.apiUrl}/items/${productId}`, { withCredentials: true })
      .subscribe((cart) => this.cartSubject.next(cart));
  }

  clear(): void {
    this.http
      .delete<Cart>(this.apiUrl, { withCredentials: true })
      .subscribe((cart) => this.cartSubject.next(cart));
  }

  checkout(): Observable<Cart> {
    return this.http
      .post<Cart>(`${this.apiUrl}/checkout`, {}, { withCredentials: true })
      .pipe(tap((cart) => this.cartSubject.next(cart)));
  }
}
