// src/app/products/product-list/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Product, EstadoProducto } from '../../models/product.model';
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

  categorias: (Product['category'] | 'Todas')[] = [
    'Todas',
    'Camiseta',
    'Sudadera',
    'Pantalón',
    'Accesorio',
    'Chaqueta',
  ];

  filtroCategoria: Product['category'] | 'Todas' = 'Todas';
  precioMin: number | null = null;
  precioMax: number | null = null;

  estados: (EstadoProducto | 'Todos')[] = [
    'Todos',
    'Activo',
    'Oculto',
    'Agotado',
    'Proximamente'
  ];
  
  filtroEstado: EstadoProducto | 'Todos' = 'Todos';
  
  opcionesStock: { valor: string; texto: string; min: number | null; max: number | null }[] = [
    { valor: 'todos', texto: 'Todo el stock', min: null, max: null },
    { valor: 'cero', texto: 'Sin stock (0)', min: 0, max: 0 },
    { valor: 'bajo', texto: 'Stock bajo (1-10)', min: 1, max: 10 },
    { valor: 'medio', texto: 'Stock medio (11-50)', min: 11, max: 50 },
    { valor: 'alto', texto: 'Stock alto (>50)', min: 51, max: null }
  ];
  
  filtroStock: string = 'todos';

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.productService.getProducts().subscribe({
      next: (data: Product[]) => {
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
    return this.products.filter((p) => {
      const okCategoria =
        this.filtroCategoria === 'Todas' ? true : p.category === this.filtroCategoria;

      const okMin = this.precioMin == null ? true : p.price >= this.precioMin;
      const okMax = this.precioMax == null ? true : p.price <= this.precioMax;

      const okEstado = this.filtroEstado === 'Todos' ? true : p.status === this.filtroEstado;

      const opcionStock = this.opcionesStock.find(o => o.valor === this.filtroStock);
      let okStock = true;
      
      if (opcionStock) {
        if (opcionStock.min !== null && opcionStock.max !== null) {
          okStock = p.stock >= opcionStock.min && p.stock <= opcionStock.max;
        } else if (opcionStock.min !== null && opcionStock.max === null) {
          okStock = p.stock >= opcionStock.min;
        } else if (opcionStock.min === null && opcionStock.max !== null) {
          okStock = p.stock <= opcionStock.max;
        }
      }

      return okCategoria && okMin && okMax && okEstado && okStock;
    });
  }

  limpiarFiltros(): void {
    this.filtroCategoria = 'Todas';
    this.precioMin = null;
    this.precioMax = null;
    this.filtroEstado = 'Todos';
    this.filtroStock = 'todos';
  }

  verDetalle(producto: Product): void {
    this.router.navigate(['/productos', producto.id]);
  }

  editar(p: Product): void {
    this.router.navigate(['/editar-producto', p.id]);
  }

  eliminar(p: Product): void {
    const ok = confirm(`¿Seguro que quieres eliminar "${p.name}"?`);
    if (!ok) return;

    this.productService.deleteProduct(p.id).subscribe(() => {
      this.products = this.products.filter(x => x.id !== p.id);
    });
  }

  imagenFallback(categoria: Product['category']): string {
    const fallbacks: Record<Product['category'], string> = {
      'Camiseta': 'assets/img/ceos-tee.svg',
      'Sudadera': 'assets/img/ceos-hoodie.svg',
      'Pantalón': 'assets/img/ceos-pants.svg',
      'Accesorio': 'assets/img/ceos-cap.svg',
      'Chaqueta': 'assets/img/ceos-jacket.svg'
    };
    return fallbacks[categoria] || 'assets/img/ceos-tee.svg';
  }

  onErrorImagen(evento: Event, categoria: Product['category']): void {
    const img = evento.target as HTMLImageElement | null;
    if (!img) return;

    const fallback = this.imagenFallback(categoria);
    if (img.src.includes(fallback)) return;
    
    img.src = fallback;
  }
}