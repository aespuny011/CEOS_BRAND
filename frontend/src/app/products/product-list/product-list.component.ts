import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { EstadoProducto, Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  errorMsg: string | null = null;
  productPendingCart: Product | null = null;

  categorias: (string | 'Todas')[] = ['Todas', 'Camiseta', 'Sudadera', 'Pantalón', 'Accesorio', 'Chaqueta'];
  filtroCategoria: string | 'Todas' = 'Todas';
  precioMin: number | null = null;
  precioMax: number | null = null;

  estados: (EstadoProducto | 'Todos')[] = ['Todos', 'Activo', 'Agotado', 'Proximamente'];
  filtroEstado: EstadoProducto | 'Todos' = 'Todos';

  opcionesStock: { valor: string; texto: string; min: number | null; max: number | null }[] = [
    { valor: 'todos', texto: 'Todo el stock', min: null, max: null },
    { valor: 'cero', texto: 'Sin stock (0)', min: 0, max: 0 },
    { valor: 'bajo', texto: 'Stock bajo (1-10)', min: 1, max: 10 },
    { valor: 'medio', texto: 'Stock medio (11-50)', min: 11, max: 50 },
    { valor: 'alto', texto: 'Stock alto (>50)', min: 51, max: null },
  ];

  filtroStock = 'todos';

  constructor(
    private productService: ProductService,
    private router: Router,
    public authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar los productos.';
        this.loading = false;
      },
    });
  }

  get productosFiltrados(): Product[] {
    return this.products.filter((product) => {
      const okVisible = this.authService.isAdmin ? true : product.status !== 'Oculto';
      const okCategoria =
        this.filtroCategoria === 'Todas' ? true : product.category === this.filtroCategoria;
      const okMin = this.precioMin == null ? true : product.price >= this.precioMin;
      const okMax = this.precioMax == null ? true : product.price <= this.precioMax;
      const okEstado = this.filtroEstado === 'Todos' ? true : product.status === this.filtroEstado;

      const opcionStock = this.opcionesStock.find((option) => option.valor === this.filtroStock);
      let okStock = true;

      if (opcionStock) {
        if (opcionStock.min !== null && opcionStock.max !== null) {
          okStock = product.stock >= opcionStock.min && product.stock <= opcionStock.max;
        } else if (opcionStock.min !== null) {
          okStock = product.stock >= opcionStock.min;
        } else if (opcionStock.max !== null) {
          okStock = product.stock <= opcionStock.max;
        }
      }

      return okVisible && okCategoria && okMin && okMax && okEstado && okStock;
    });
  }

  limpiarFiltros(): void {
    this.filtroCategoria = 'Todas';
    this.precioMin = null;
    this.precioMax = null;
    this.filtroEstado = 'Todos';
    this.filtroStock = 'todos';
  }

  verDetalle(product: Product): void {
    this.router.navigate(['/productos', product.id]);
  }

  editar(product: Product): void {
    if (!this.authService.isAdmin) {
      return;
    }

    this.router.navigate(['/editar-producto', product.id]);
  }

  eliminar(product: Product): void {
    if (!this.authService.isAdmin) {
      return;
    }

    const confirmed = confirm(`¿Seguro que quieres eliminar "${product.name}"?`);
    if (!confirmed) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe(() => {
      this.products = this.products.filter((item) => item.id !== product.id);
    });
  }

  canPurchase(product: Product): boolean {
    return product.status === 'Activo' && product.stock > 0;
  }

  requestAddToCart(product: Product): void {
    if (!this.canPurchase(product)) {
      return;
    }

    this.productPendingCart = product;
  }

  confirmAddToCart(): void {
    if (!this.productPendingCart) {
      return;
    }

    this.cartService.addProduct(this.productPendingCart);
    this.productPendingCart = null;
  }

  cancelAddToCart(): void {
    this.productPendingCart = null;
  }

  imagenFallback(categoria: string): string {
    const fallbacks: Record<string, string> = {
      Camiseta: 'assets/img/ceos-tee.svg',
      Sudadera: 'assets/img/ceos-hoodie.svg',
      Pantalón: 'assets/img/ceos-pants.svg',
      Accesorio: 'assets/img/ceos-cap.svg',
      Chaqueta: 'assets/img/ceos-jacket.svg',
    };

    return fallbacks[categoria] || 'assets/img/ceos-tee.svg';
  }

  onErrorImagen(event: Event, categoria: string): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }

    const fallback = this.imagenFallback(categoria);
    if (img.src.includes(fallback)) {
      return;
    }

    img.src = fallback;
  }
}
