export interface OrderItem {
  productId: number;
  productName: string;
  productImageUrl: string;
  productCategory: string;
  productSize: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}
