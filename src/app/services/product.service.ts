// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';

import { Product } from '../models/product.model';
import { AlmacenLocalService } from './almacen-local.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'api/products';

  constructor(
    private http: HttpClient,
    private almacen: AlmacenLocalService
  ) {}

  getProducts(): Observable<Product[]> {
    const guardados = this.almacen.leerProductos();
    if (guardados && guardados.length) return of(this.ordenar(guardados));

    return this.http.get<Product[]>(this.apiUrl).pipe(
      map((productos) => this.ordenar(productos)),
      tap((productos: Product[]) => this.almacen.guardarProductos(productos)),
      catchError(() => of([] as Product[]))
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    const guardados: Product[] = this.almacen.leerProductos() ?? [];
    const encontrado = guardados.find((p: Product) => p.id === id);
    if (encontrado) return of(encontrado);

    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  addProduct(productoSinId: Omit<Product, 'id'>): Observable<Product> {
    const productos: Product[] = this.almacen.leerProductos() ?? [];
    const nuevoId = this.generarId(productos);

    const nuevoProducto: Product = {
      ...productoSinId,
      id: nuevoId,
    };

    const guardado = this.ordenar([nuevoProducto, ...productos]);
    this.almacen.guardarProductos(guardado);

    return this.http.post<Product>(this.apiUrl, nuevoProducto).pipe(
      catchError(() => of(nuevoProducto))
    );
  }

  updateProduct(id: number, cambios: Omit<Product, 'id'>): Observable<Product | undefined> {
    const productos: Product[] = this.almacen.leerProductos() ?? [];
    const indice = productos.findIndex((p: Product) => p.id === id);
    if (indice === -1) return of(undefined);

    const actualizado: Product = {
      ...productos[indice],
      ...cambios,
      id,
    };

    const actualizados = [...productos];
    actualizados[indice] = actualizado;

    const guardado = this.ordenar(actualizados);
    this.almacen.guardarProductos(guardado);

    return this.http.put<Product>(`${this.apiUrl}/${id}`, actualizado).pipe(
      catchError(() => of(actualizado))
    );
  }

  deleteProduct(id: number): Observable<boolean> {
    const productos: Product[] = this.almacen.leerProductos() ?? [];
    const antes = productos.length;

    const actualizados = productos.filter((p: Product) => p.id !== id);
    this.almacen.guardarProductos(this.ordenar(actualizados));

    const eliminadoLocal = actualizados.length !== antes;

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null)),
      map(() => eliminadoLocal)
    );
  }

  private ordenar(productos: Product[]): Product[] {
    return [...productos].sort((a, b) => a.id - b.id);
  }

  private generarId(productos: Product[]): number {
    const maxId = productos.reduce((max, p) => (p.id > max ? p.id : max), 0);
    return maxId + 1;
  }
}