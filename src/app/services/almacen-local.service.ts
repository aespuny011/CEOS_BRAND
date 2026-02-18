// src/app/services/almacen-local.service.ts
import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class AlmacenLocalService {
  private readonly STORAGE_KEY = 'ceos_productos';

  constructor() {}

  guardarProductos(productos: Product[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(productos));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  leerProductos(): Product[] | null {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      return datos ? JSON.parse(datos) : null;
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  }

  limpiar(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}