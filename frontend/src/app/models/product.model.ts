export type EstadoProducto = 'Activo' | 'Oculto' | 'Agotado' | 'Proximamente';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  images: string[];
  description: string;
  status: EstadoProducto;
  stock: number;
  availableSizes: string[];
  sizeStock: Record<string, number>;
  purchasable: boolean;
}

export type ProductPayload = Omit<Product, 'id' | 'availableSizes' | 'purchasable'>;
