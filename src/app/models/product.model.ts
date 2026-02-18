// src/app/models/product.model.ts
export type EstadoProducto = 'Activo' | 'Oculto' | 'Agotado' | 'Proximamente';

export interface Product {
  id: number;
  name: string;
  category: 'Camiseta' | 'Sudadera' | 'Pantalón' | 'Accesorio' | 'Chaqueta';
  price: number;
  imageUrl: string;      // Imagen principal
  images: string[];      // Array de imágenes adicionales
  description: string;
  status: EstadoProducto;
  stock: number;
}