// src/app/pages/crear-producto/crear-producto.component.ts
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Product, EstadoProducto, ProductPayload } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-crear-producto',
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.scss'],
})
export class CrearProductoComponent {
  loading = false;
  guardando = false;
  errorMsg: string | null = null;

  categorias: Product['category'][] = [
    'Camiseta',
    'Sudadera',
    'Pantalón',
    'Accesorio',
    'Chaqueta',
  ];
  estados: EstadoProducto[] = ['Activo', 'Oculto', 'Agotado', 'Proximamente'];

  private readonly TAMANO_MAXIMO_ORIGINAL = 12 * 1024 * 1024; // 12 MB
  private readonly MAX_LADO = 1200;
  private readonly CALIDAD_JPEG = 0.75;

  formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: [null as Product['category'] | null, [Validators.required]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    imageUrl: ['', [Validators.required]],
    images: [[] as string[]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    status: ['Activo' as EstadoProducto, [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private authService: AuthService
  ) {
    if (!this.authService.isAdmin) {
      this.router.navigate(['/productos']);
    }
  }

  get imagenPrincipal(): string {
    return this.formulario.value.imageUrl || '';
  }

  get todasLasImagenes(): string[] {
    const imagenes = this.formulario.value.images || [];
    const imagenPrincipal = this.formulario.value.imageUrl;
    
    if (imagenPrincipal) {
      return [imagenPrincipal, ...imagenes];
    }
    return imagenes;
  }

  async seleccionarImagenPrincipal(evento: Event): Promise<void> {
    this.errorMsg = null;
    const input = evento.target as HTMLInputElement;
    const archivos = input.files;
    
    if (!archivos || archivos.length === 0) {
      input.value = '';
      return;
    }

    const archivo = archivos[0];

    if (!archivo.type.startsWith('image/')) {
      this.errorMsg = 'El archivo seleccionado no es una imagen.';
      input.value = '';
      return;
    }

    if (archivo.size > this.TAMANO_MAXIMO_ORIGINAL) {
      this.errorMsg = `La imagen original es demasiado grande (máx. ${
        this.TAMANO_MAXIMO_ORIGINAL / (1024 * 1024)
      }MB).`;
      input.value = '';
      return;
    }

    try {
      const dataUrlComprimido = await this.comprimirImagen(
        archivo,
        this.MAX_LADO,
        this.CALIDAD_JPEG
      );
      this.formulario.patchValue({ imageUrl: dataUrlComprimido });
    } catch {
      this.errorMsg = 'No se pudo procesar la imagen principal.';
    } finally {
      input.value = '';
    }
  }

  async seleccionarImagenesAdicionales(evento: Event): Promise<void> {
    this.errorMsg = null;
    const input = evento.target as HTMLInputElement;
    const archivos = input.files;
    
    if (!archivos || archivos.length === 0) {
      input.value = '';
      return;
    }

    const imagenesSeleccionadas: string[] = [...(this.formulario.value.images || [])];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];

      if (!archivo.type.startsWith('image/')) {
        this.errorMsg = `El archivo "${archivo.name}" no es una imagen.`;
        input.value = '';
        return;
      }

      if (archivo.size > this.TAMANO_MAXIMO_ORIGINAL) {
        this.errorMsg = `La imagen "${archivo.name}" es demasiado grande (máx. ${
          this.TAMANO_MAXIMO_ORIGINAL / (1024 * 1024)
        }MB).`;
        input.value = '';
        return;
      }

      try {
        const dataUrlComprimido = await this.comprimirImagen(
          archivo,
          this.MAX_LADO,
          this.CALIDAD_JPEG
        );
        imagenesSeleccionadas.push(dataUrlComprimido);
      } catch {
        this.errorMsg = `No se pudo procesar la imagen "${archivo.name}".`;
        input.value = '';
        return;
      }
    }

    this.formulario.patchValue({ images: imagenesSeleccionadas });
    input.value = '';
  }

  quitarImagenPrincipal(input?: HTMLInputElement): void {
    this.formulario.patchValue({ imageUrl: '' });
    this.limpiarInputArchivo(input);
  }

  quitarImagenAdicional(index: number, input?: HTMLInputElement): void {
    const imagenesActuales = [...(this.formulario.value.images || [])];
    imagenesActuales.splice(index, 1);
    this.formulario.patchValue({ images: imagenesActuales });
    this.limpiarInputArchivo(input);
  }

  quitarTodasLasImagenes(inputPrincipal?: HTMLInputElement, inputAdicionales?: HTMLInputElement): void {
    this.formulario.patchValue({ 
      imageUrl: '',
      images: [] 
    });
    this.limpiarInputArchivo(inputPrincipal);
    this.limpiarInputArchivo(inputAdicionales);
  }

  private limpiarInputArchivo(input?: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
  }

  enviar(): void {
    console.log('Botón guardar presionado'); // Para debug
    
    this.errorMsg = null;

    if (this.formulario.invalid) {
      console.log('Formulario inválido', this.formulario.errors);
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    console.log('Guardando producto...');

    const nuevoProducto: ProductPayload = {
      name: this.formulario.value.name!,
      category: this.formulario.value.category!,
      price: this.formulario.value.price!,
      imageUrl: this.formulario.value.imageUrl || 'assets/img/ceos-tee.svg', // Fallback si no hay imagen
      images: this.formulario.value.images || [],
      description: this.formulario.value.description!,
      status: this.formulario.value.status!,
      stock: this.formulario.value.stock!,
    };

    console.log('Producto a guardar:', nuevoProducto);

    this.productService.addProduct(nuevoProducto).subscribe({
      next: (productoCreado: Product) => {
        console.log('Producto guardado:', productoCreado);
        this.guardando = false;
        this.router.navigate(['/productos', productoCreado.id]);
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.guardando = false;
        this.errorMsg = 'No se pudo guardar el producto.';
      },
    });
  }

  tocado(nombre: string): boolean {
    const control = this.formulario.get(nombre);
    return control ? control.touched && control.invalid : false;
  }

  private async comprimirImagen(
    archivo: File,
    maxLado: number,
    calidad: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxLado) {
              height = Math.round((height * maxLado) / width);
              width = maxLado;
            }
          } else {
            if (height > maxLado) {
              width = Math.round((width * maxLado) / height);
              height = maxLado;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('No se pudo crear el contexto del canvas');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', calidad);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }
}
