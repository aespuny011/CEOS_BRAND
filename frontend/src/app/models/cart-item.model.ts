export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  quantity: number;
  maxStock: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
