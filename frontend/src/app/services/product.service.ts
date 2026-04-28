import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, { withCredentials: true });
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  addProduct(productoSinId: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, productoSinId, { withCredentials: true });
  }

  updateProduct(id: number, cambios: Omit<Product, 'id'>): Observable<Product | undefined> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, cambios, { withCredentials: true });
  }

  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
