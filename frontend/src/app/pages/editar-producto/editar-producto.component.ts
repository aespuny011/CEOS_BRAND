import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Product, EstadoProducto, ProductPayload } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-editar-producto',
  templateUrl: './editar-producto.component.html',
  styleUrls: ['./editar-producto.component.scss'],
})
export class EditarProductoComponent implements OnInit {
  loading = true;
  guardando = false;
  errorMsg: string | null = null;
  saveErrorMsg: string | null = null;

  mostrarMensajeExito = false;

  categorias: Product['category'][] = ['Camiseta', 'Sudadera', 'Pantalón', 'Accesorio', 'Chaqueta'];
  estados: EstadoProducto[] = ['Activo', 'Oculto', 'Agotado', 'Proximamente'];

  private idProducto: number | null = null;

  // imágenes (múltiples). La primera será la principal (imageUrl).
  imagenesSeleccionadas: string[] = [];
  private imagenesAdicionalesActuales: string[] = [];

  private readonly TAMANO_MAXIMO_ORIGINAL = 12 * 1024 * 1024;
  private readonly MAX_LADO = 1200;
  private readonly CALIDAD_JPEG = 0.75;

  // IMPORTANTE: tipado correcto para evitar el error de "price"
  formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: [null as Product['category'] | null, [Validators.required]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    status: ['Activo' as EstadoProducto, [Validators.required]],
    stock: [0 as number | null, [Validators.required, Validators.min(0)]],

    // mantenemos imageUrl para no romper pantallas que lo usen
    imageUrl: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private productos: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin) {
      this.router.navigate(['/productos']);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.errorMsg = 'ID de producto inválido.';
      this.loading = false;
      return;
    }

    this.idProducto = id;
    this.cargarProducto(id);
  }

  // Para tu HTML: [disabled]="!imagenActual" y preview
  get imagenActual(): string {
    return this.imagenesSeleccionadas[0] || this.formulario.value.imageUrl || '';
  }

  get imagenesAdicionales(): string[] {
    return this.imagenesAdicionalesActuales;
  }

  get todasLasImagenes(): string[] {
    const principal = this.imagenActual;
    return principal ? [principal, ...this.imagenesAdicionales] : this.imagenesAdicionales;
  }

  private cargarProducto(id: number): void {
    this.loading = true;
    this.errorMsg = null;
    this.saveErrorMsg = null;

    this.productos.getProductById(id).subscribe({
      next: (producto: Product | undefined) => {
        if (!producto) {
          this.errorMsg = 'Producto no encontrado.';
          this.loading = false;
          return;
        }

        const imgs = Array.isArray(producto.images) ? producto.images.filter(Boolean) : [];
        const imagenPrincipal = producto.imageUrl || imgs[0] || '';

        this.imagenesSeleccionadas = imagenPrincipal ? [imagenPrincipal] : [];
        this.imagenesAdicionalesActuales = imgs.filter((img) => img !== imagenPrincipal);

        this.formulario.patchValue({
          name: producto.name,
          category: producto.category,
          price: producto.price,
          description: producto.description,
          status: producto.status,
          stock: producto.stock,
          imageUrl: imagenPrincipal,
        });

        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar el producto.';
        this.loading = false;
      },
    });
  }

  // ✅ Compatibilidad con tu HTML viejo: (change)="seleccionarImagen($event)"
  async seleccionarImagen(evento: Event): Promise<void> {
    await this.seleccionarImagenPrincipal(evento);
  }

  // Si tu input tiene multiple, esto cargará varias. Si no, cargará 1.
  async seleccionarImagenPrincipal(evento: Event): Promise<void> {
    this.errorMsg = null;
    this.saveErrorMsg = null;

    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    if (!archivos.length) return;

    // Validaciones rápidas
    for (const archivo of archivos) {
      if (!archivo.type.startsWith('image/')) {
        this.errorMsg = 'Uno de los archivos no es una imagen.';
        input.value = '';
        return;
      }
      if (archivo.size > this.TAMANO_MAXIMO_ORIGINAL) {
        this.errorMsg = 'Una de las imágenes es demasiado grande (máx. 12MB).';
        input.value = '';
        return;
      }
    }

    try {
      this.loading = true;

      const principal = await this.comprimirImagen(archivos[0], this.MAX_LADO, this.CALIDAD_JPEG);

      // Reemplazamos por las nuevas imágenes
      this.imagenesSeleccionadas = [principal];
      this.formulario.patchValue({ imageUrl: principal });
      this.formulario.get('imageUrl')?.markAsTouched();
    } catch {
      this.errorMsg = 'No se pudieron procesar las imágenes.';
    } finally {
      this.loading = false;
      input.value = '';
    }
  }

  // ✅ Compatibilidad con tu HTML viejo
  async seleccionarImagenesAdicionales(evento: Event): Promise<void> {
    this.errorMsg = null;
    this.saveErrorMsg = null;

    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    if (!archivos.length) return;

    for (const archivo of archivos) {
      if (!archivo.type.startsWith('image/')) {
        this.errorMsg = 'Uno de los archivos no es una imagen.';
        input.value = '';
        return;
      }
      if (archivo.size > this.TAMANO_MAXIMO_ORIGINAL) {
        this.errorMsg = 'Una de las imÃ¡genes es demasiado grande (mÃ¡x. 12MB).';
        input.value = '';
        return;
      }
    }

    try {
      this.loading = true;

      const nuevasImagenes: string[] = [];
      for (const archivo of archivos) {
        nuevasImagenes.push(await this.comprimirImagen(archivo, this.MAX_LADO, this.CALIDAD_JPEG));
      }

      const principal = this.imagenActual;
      this.imagenesAdicionalesActuales = [
        ...this.imagenesAdicionalesActuales,
        ...nuevasImagenes,
      ].filter((img) => img && img !== principal);
    } catch {
      this.errorMsg = 'No se pudieron procesar las imÃ¡genes secundarias.';
    } finally {
      this.loading = false;
      input.value = '';
    }
  }

  quitarImagen(): void {
    this.imagenesSeleccionadas = [];
    this.formulario.patchValue({ imageUrl: '' });
    this.formulario.get('imageUrl')?.markAsTouched();
  }

  quitarImagenAdicional(index: number, input?: HTMLInputElement): void {
    this.imagenesAdicionalesActuales = this.imagenesAdicionalesActuales.filter((_, i) => i !== index);
    if (input) {
      input.value = '';
    }
  }

  quitarTodasLasImagenes(inputPrincipal?: HTMLInputElement, inputAdicionales?: HTMLInputElement): void {
    this.imagenesSeleccionadas = [];
    this.imagenesAdicionalesActuales = [];
    this.formulario.patchValue({ imageUrl: '' });
    this.formulario.get('imageUrl')?.markAsTouched();

    if (inputPrincipal) {
      inputPrincipal.value = '';
    }
    if (inputAdicionales) {
      inputAdicionales.value = '';
    }
  }

  // ✅ Tu HTML usa (ngSubmit)="guardar()"
  guardar(): void {
    this.saveErrorMsg = null;

    if (this.formulario.invalid || this.idProducto == null) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const principal = this.imagenesSeleccionadas[0] || this.formulario.value.imageUrl || '';
    const imagesFinal = this.imagenesAdicionalesActuales.filter((img) => img && img !== principal);

    const cambios: ProductPayload = {
      name: this.formulario.value.name!,
      category: this.formulario.value.category as Product['category'],
      price: Number(this.formulario.value.price),
      description: this.formulario.value.description!,

      status: this.formulario.value.status as EstadoProducto,
      stock: Number(this.formulario.value.stock),

      imageUrl: principal,
      images: imagesFinal,
    };

    // ✅ AQUÍ estaba uno de tus errores: updateProduct(id, cambios)
    this.productos.updateProduct(this.idProducto, cambios).subscribe({
      next: () => {
        this.guardando = false;

        this.mostrarMensajeExito = true;
        setTimeout(() => (this.mostrarMensajeExito = false), 2500);

        // Si quieres volver al detalle del producto, cambia la ruta:
        // this.router.navigate(['/productos', this.idProducto]);
        this.router.navigate(['/productos']);
      },
      error: (error) => {
        this.guardando = false;
        this.saveErrorMsg = error?.error?.message || 'No se pudieron guardar los cambios.';
      },
    });
  }

  tocado(nombre: string): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.touched && c.invalid;
  }

  evitarCambioConRueda(evento: WheelEvent): void {
    (evento.target as HTMLInputElement).blur();
  }

  private async comprimirImagen(archivo: File, maxLado: number, calidad: number): Promise<string> {
    const bitmap = await createImageBitmap(archivo);
    const { ancho, alto } = this.calcularNuevoTamano(bitmap.width, bitmap.height, maxLado);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const dataUrl = canvas.toDataURL('image/jpeg', calidad);
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  }

  private calcularNuevoTamano(width: number, height: number, maxLado: number): { ancho: number; alto: number } {
  if (width <= maxLado && height <= maxLado) return { ancho: width, alto: height };

  if (width >= height) {
    const ratio = maxLado / width;
    return { ancho: maxLado, alto: Math.round(height * ratio) }; // Este es el retorno correcto
  } else {
    const ratio = maxLado / height;
    return { ancho: Math.round(width * ratio), alto: maxLado }; // Y aquí también se incluye la propiedad 'alto'
  }
}
}
