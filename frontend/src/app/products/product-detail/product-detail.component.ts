import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  producto: Product | null = null;
  loading = true;
  errorMsg: string | null = null;
  imagenSeleccionada = '';
  visorAbierto = false;
  confirmCartOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cargarProducto();
  }

  cargarProducto(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isNaN(id)) {
      this.errorMsg = 'ID de producto invalido';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (producto) => {
        if (!producto) {
          this.errorMsg = 'Producto no encontrado';
        } else {
          this.producto = producto;
          this.imagenSeleccionada = producto.imageUrl;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Error al cargar el producto';
        this.loading = false;
      },
    });
  }

  volver(): void {
    this.router.navigate(['/productos']);
  }

  mostrarEstado(estado: Product['status']): string {
    const estados: Record<Product['status'], string> = {
      Activo: 'ACTIVO',
      Oculto: 'OCULTO',
      Agotado: 'AGOTADO',
      Proximamente: 'PROXIMAMENTE',
    };

    return estados[estado] || estado;
  }

  onErrorImagen(): void {
    if (this.producto) {
      this.producto.imageUrl = this.imagenFallback(this.producto.category);
    }
  }

  private imagenFallback(categoria: string): string {
    const fallbacks: Record<string, string> = {
      Camiseta: 'assets/img/ceos-tee.svg',
      Sudadera: 'assets/img/ceos-hoodie.svg',
      Pantalón: 'assets/img/ceos-pants.svg',
      Accesorio: 'assets/img/ceos-cap.svg',
      Chaqueta: 'assets/img/ceos-jacket.svg',
    };
    return fallbacks[categoria] || 'assets/img/ceos-tee.svg';
  }

  abrirVisor(imagen: string): void {
    this.imagenSeleccionada = imagen;
    this.visorAbierto = true;
  }

  cerrarVisor(): void {
    this.visorAbierto = false;
  }

  siguienteImagen(): void {
    if (!this.producto) return;

    const indexActual = this.todasLasImagenes.indexOf(this.imagenSeleccionada);
    const siguienteIndex = (indexActual + 1) % this.todasLasImagenes.length;
    this.imagenSeleccionada = this.todasLasImagenes[siguienteIndex];
  }

  anteriorImagen(): void {
    if (!this.producto) return;

    const indexActual = this.todasLasImagenes.indexOf(this.imagenSeleccionada);
    const anteriorIndex = (indexActual - 1 + this.todasLasImagenes.length) % this.todasLasImagenes.length;
    this.imagenSeleccionada = this.todasLasImagenes[anteriorIndex];
  }

  get todasLasImagenes(): string[] {
    if (!this.producto) {
      return [];
    }

    return [this.producto.imageUrl, ...(this.producto.images || [])];
  }

  canPurchase(): boolean {
    return this.producto?.purchasable === true;
  }

  requestAddToCart(): void {
    if (!this.canPurchase()) {
      return;
    }

    this.confirmCartOpen = true;
  }

  cancelAddToCart(): void {
    this.confirmCartOpen = false;
  }

  confirmAddToCart(): void {
    if (!this.producto || !this.canPurchase()) {
      return;
    }

    this.cartService.addProduct(this.producto);
    this.confirmCartOpen = false;
  }
}
