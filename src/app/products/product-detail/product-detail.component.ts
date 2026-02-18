// src/app/products/product-detail/product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Product } from '../../models/product.model';
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
  
  // Para el visor de imágenes
  imagenSeleccionada: string = '';
  visorAbierto: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.cargarProducto();
  }

  cargarProducto(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (isNaN(id)) {
      this.errorMsg = 'ID de producto inválido';
      this.loading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (producto) => {
        if (!producto) {
          this.errorMsg = 'Producto no encontrado';
        } else {
          this.producto = producto;
          this.imagenSeleccionada = producto.imageUrl; // Imagen principal por defecto
        }
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Error al cargar el producto';
        this.loading = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/productos']);
  }

  mostrarEstado(estado: Product['status']): string {
    const estados: Record<Product['status'], string> = {
      'Activo': 'ACTIVO',
      'Oculto': 'OCULTO',
      'Agotado': 'AGOTADO',
      'Proximamente': 'PRÓXIMAMENTE'
    };
    return estados[estado] || estado;
  }

  onErrorImagen(): void {
    if (this.producto) {
      this.producto.imageUrl = this.imagenFallback(this.producto.category);
    }
  }

  private imagenFallback(categoria: Product['category']): string {
    const fallbacks: Record<Product['category'], string> = {
      'Camiseta': 'assets/img/ceos-tee.svg',
      'Sudadera': 'assets/img/ceos-hoodie.svg',
      'Pantalón': 'assets/img/ceos-pants.svg',
      'Accesorio': 'assets/img/ceos-cap.svg',
      'Chaqueta': 'assets/img/ceos-jacket.svg'
    };
    return fallbacks[categoria] || 'assets/img/ceos-tee.svg';
  }

  // NUEVO: Abrir imagen en el visor
  abrirVisor(imagen: string): void {
    this.imagenSeleccionada = imagen;
    this.visorAbierto = true;
  }

  // NUEVO: Cerrar el visor
  cerrarVisor(): void {
    this.visorAbierto = false;
  }

  // NUEVO: Navegar entre imágenes
  siguienteImagen(): void {
    if (!this.producto) return;
    
    const todasLasImagenes = this.todasLasImagenes;
    const indexActual = todasLasImagenes.indexOf(this.imagenSeleccionada);
    const siguienteIndex = (indexActual + 1) % todasLasImagenes.length;
    this.imagenSeleccionada = todasLasImagenes[siguienteIndex];
  }

  anteriorImagen(): void {
    if (!this.producto) return;
    
    const todasLasImagenes = this.todasLasImagenes;
    const indexActual = todasLasImagenes.indexOf(this.imagenSeleccionada);
    const anteriorIndex = (indexActual - 1 + todasLasImagenes.length) % todasLasImagenes.length;
    this.imagenSeleccionada = todasLasImagenes[anteriorIndex];
  }

  // NUEVO: Obtener todas las imágenes (principal + adicionales)
  get todasLasImagenes(): string[] {
    if (!this.producto) return [];
    return [this.producto.imageUrl, ...(this.producto.images || [])];
  }
}