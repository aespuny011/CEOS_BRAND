import { Component, OnInit } from '@angular/core';

import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  errorMsg = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar los pedidos.';
        this.loading = false;
      },
    });
  }
}
