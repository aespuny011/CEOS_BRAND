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
  selectedCartSize = '';
  busqueda = '';
  ordenCatalogo: 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre' = 'recientes';

  categorias: string[] = ['Camiseta', 'Sudadera', 'Pantalón', 'Gorra'];
  filtroCategorias: string[] = [];
  precioMin: number | null = null;
  precioMax: number | null = null;

  estados: EstadoProducto[] = ['Activo', 'Agotado', 'Proximamente'];
  filtroEstados: string[] = [];

  opcionesStock: { valor: string; texto: string; min: number | null; max: number | null }[] = [
    { valor: 'cero', texto: 'Sin stock (0)', min: 0, max: 0 },
    { valor: 'bajo', texto: 'Stock bajo (1-10)', min: 1, max: 10 },
    { valor: 'medio', texto: 'Stock medio (11-50)', min: 11, max: 50 },
    { valor: 'alto', texto: 'Stock alto (>50)', min: 51, max: null },
  ];

  filtrosStock: string[] = [];

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
      if (!this.authService.isAdmin && product.status === 'Oculto') {
        return false;
      }

      const categoryMatches = !this.filtroCategorias.length || this.filtroCategorias.includes(product.category);
      const statusMatches = !this.filtroEstados.length || this.filtroEstados.some((status) => this.productMatchesStatus(product, status));
      const stockMatches = !this.filtrosStock.length || this.filtrosStock.some((stock) => this.productMatchesStock(product, stock));
      const minPriceMatches = this.precioMin == null || product.price >= this.precioMin;
      const maxPriceMatches = this.precioMax == null || product.price <= this.precioMax;
      const searchMatches = this.productMatchesSearch(product);

      return categoryMatches && statusMatches && stockMatches && minPriceMatches && maxPriceMatches && searchMatches;
    });
  }

  get productosCatalogoFiltrados(): Product[] {
    return this.sortProducts(this.productosFiltrados.filter((product) => product.status !== 'Proximamente'));
  }

  get productosDisponiblesFiltrados(): Product[] {
    return this.productosFiltrados.filter((product) => product.status === 'Activo' && product.stock > 0);
  }

  get productosProximamenteFiltrados(): Product[] {
    return this.sortProducts(this.productosFiltrados.filter((product) => product.status === 'Proximamente'));
  }

  get productosAgotadosFiltrados(): Product[] {
    return this.productosFiltrados.filter((product) => (
      product.stock === 0 &&
      product.status !== 'Proximamente' &&
      product.status !== 'Oculto'
    ));
  }

  get totalProductosContables(): number {
    return this.authService.isAdmin
      ? this.products.length
      : this.products.filter((product) => this.isVisibleForCustomer(product)).length;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.ordenCatalogo = 'recientes';
    this.filtroCategorias = [];
    this.precioMin = null;
    this.precioMax = null;
    this.filtroEstados = [];
    this.filtrosStock = [];
    this.cargar();
  }

  toggleFiltro(lista: string[], valor: string): void {
    const index = lista.indexOf(valor);

    if (index >= 0) {
      lista.splice(index, 1);
    } else {
      lista.push(valor);
    }

    this.cargar();
  }

  estaSeleccionado(lista: string[], valor: string): boolean {
    return lista.includes(valor);
  }

  resumenSeleccion(lista: string[], textoBase: string, opciones?: { valor: string; texto: string }[]): string {
    if (!lista.length) {
      return textoBase;
    }

    const textos = lista.map((valor) => opciones?.find((opcion) => opcion.valor === valor)?.texto ?? this.mostrarEstado(valor));
    return textos.length > 2 ? `${textos.slice(0, 2).join(', ')} +${textos.length - 2}` : textos.join(', ');
  }

  mostrarEstado(estado: string): string {
    return estado === 'Proximamente' ? 'Próximamente' : estado;
  }

  private productMatchesStatus(product: Product, status: string): boolean {
    if (status === 'Agotado') {
      return product.stock === 0 && product.status !== 'Proximamente' && product.status !== 'Oculto';
    }

    return product.status === status;
  }

  private isVisibleForCustomer(product: Product): boolean {
    return product.status !== 'Oculto';
  }

  private productMatchesSearch(product: Product): boolean {
    const search = this.busqueda.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return [product.name, product.category, product.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  }

  private sortProducts(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      switch (this.ordenCatalogo) {
        case 'precio-asc':
          return a.price - b.price;
        case 'precio-desc':
          return b.price - a.price;
        case 'nombre':
          return a.name.localeCompare(b.name);
        default:
          return b.id - a.id;
      }
    });
  }

  private productMatchesStock(product: Product, stock: string): boolean {
    switch (stock) {
      case 'cero':
        return product.stock === 0;
      case 'bajo':
        return product.stock >= 1 && product.stock <= 10;
      case 'medio':
        return product.stock >= 11 && product.stock <= 50;
      case 'alto':
        return product.stock > 50;
      default:
        return true;
    }
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
    return product.purchasable;
  }

  requestAddToCart(product: Product): void {
    if (!this.canPurchase(product)) {
      return;
    }

    this.productPendingCart = product;
    this.selectedCartSize = this.firstAvailableSize(product);
  }

  confirmAddToCart(): void {
    if (!this.productPendingCart) {
      return;
    }

    this.cartService.addProduct(this.productPendingCart, 1, this.selectedCartSize);
    this.productPendingCart = null;
    this.selectedCartSize = '';
  }

  cancelAddToCart(): void {
    this.productPendingCart = null;
    this.selectedCartSize = '';
  }

  hasSizes(product: Product | null): boolean {
    return (product?.availableSizes?.length ?? 0) > 0;
  }

  selectCartSize(size: string): void {
    if (this.stockForSize(this.productPendingCart, size) <= 0) {
      return;
    }
    this.selectedCartSize = size;
  }

  stockForSize(product: Product | null, size: string): number {
    return product?.sizeStock?.[size] ?? 0;
  }

  private firstAvailableSize(product: Product): string {
    return product.availableSizes?.find((size) => (product.sizeStock?.[size] ?? 0) > 0)
      ?? product.availableSizes?.[0]
      ?? '';
  }

  imagenFallback(categoria: string): string {
    const fallbacks: Record<string, string> = {
      Camiseta: 'assets/img/ceos-tee.svg',
      Sudadera: 'assets/img/ceos-hoodie.svg',
      Pantalón: 'assets/img/ceos-pants.svg',
      Gorra: 'assets/img/ceos-cap.svg',
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
