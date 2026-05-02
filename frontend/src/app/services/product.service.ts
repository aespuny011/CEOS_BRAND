import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product, ProductPayload } from '../models/product.model';

export interface ProductFilters {
  category?: string | string[];
  status?: string | string[];
  stock?: string | string[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getProducts(filters: ProductFilters = {}): Observable<Product[]> {
    const params: Record<string, string> = {};

    const category = this.toParam(filters.category, 'Todas');
    const status = this.toParam(filters.status, 'Todos');
    const stock = this.toParam(filters.stock, 'todos');

    if (category) {
      params['category'] = category;
    }

    if (status) {
      params['status'] = status;
    }

    if (stock) {
      params['stock'] = stock;
    }

    if (filters.minPrice != null) {
      params['minPrice'] = String(filters.minPrice);
    }

    if (filters.maxPrice != null) {
      params['maxPrice'] = String(filters.maxPrice);
    }

    return this.http.get<Product[]>(this.apiUrl, { params, withCredentials: true });
  }

  private toParam(value: string | string[] | undefined, allValue: string): string | null {
    if (Array.isArray(value)) {
      const selected = value.filter((item) => item && item !== allValue);
      return selected.length ? selected.join(',') : null;
    }

    return value && value !== allValue ? value : null;
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured`, { withCredentials: true });
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  addProduct(productoSinId: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productoSinId, { withCredentials: true });
  }

  updateProduct(id: number, cambios: ProductPayload): Observable<Product | undefined> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, cambios, { withCredentials: true });
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
