// src/app/services/in-memory-data.service.ts
import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const products: Product[] = [
      {
        id: 1,
        name: 'Sudadera CEØS Black',
        category: 'Sudadera',
        price: 49.99,
        imageUrl: 'assets/img/ceos-hoodie.svg',
        images: [
          'assets/img/ceos-hoodie.svg',
          'assets/img/ceos-hoodie-2.svg',
          'assets/img/ceos-hoodie-3.svg'
        ],
        description: 'Sudadera negra con logo CEØS bordado. Algodón 100% orgánico.',
        status: 'Activo',
        stock: 15,
      },
      {
        id: 2,
        name: 'Camiseta CEØS White',
        category: 'Camiseta',
        price: 24.99,
        imageUrl: 'assets/img/ceos-tee.svg',
        images: [
          'assets/img/ceos-tee.svg',
          'assets/img/ceos-tee-2.svg'
        ],
        description: 'Camiseta blanca de algodón con estampado serigráfico.',
        status: 'Activo',
        stock: 30,
      },
      {
        id: 3,
        name: 'Gorra CEØS Trucker',
        category: 'Accesorio',
        price: 29.99,
        imageUrl: 'assets/img/ceos-cap.svg',
        images: [
          'assets/img/ceos-cap.svg',
          'assets/img/ceos-cap-2.svg'
        ],
        description: 'Gorra trucker con logo bordado en la parte frontal.',
        status: 'Proximamente',
        stock: 0,
      },
    ];
    return { products };
  }

  genId(products: Product[]): number {
    return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  }
}