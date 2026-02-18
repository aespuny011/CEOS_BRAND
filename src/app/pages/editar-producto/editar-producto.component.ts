import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Product, EstadoProducto } from '../../models/product.model';
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

  mostrarMensajeExito = false;

  categorias: Product['category'][] = ['Camiseta', 'Sudadera', 'Pantalón', 'Accesorio', 'Chaqueta'];
  estados: EstadoProducto[] = ['Activo', 'Oculto', 'Agotado', 'Proximamente'];

  private idProducto: number | null = null;

  // imágenes (múltiples). La primera será la principal (imageUrl).
  imagenesSeleccionadas: string[] = [];

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
    imageUrl: [''],
  });

  constructor(
    private fb: FormBuilder,
    private productos: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
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

  private cargarProducto(id: number): void {
    this.loading = true;
    this.errorMsg = null;

    this.productos.getProductById(id).subscribe({
      next: (producto: Product | undefined) => {
        if (!producto) {
          this.errorMsg = 'Producto no encontrado.';
          this.loading = false;
          return;
        }

        // Si el producto ya tiene images, las usamos; si no, creamos desde imageUrl
        const imgs = (producto as any).images as string[] | undefined;
        this.imagenesSeleccionadas =
          Array.isArray(imgs) && imgs.length
            ? imgs
            : (producto.imageUrl ? [producto.imageUrl] : []);

        this.formulario.patchValue({
          name: producto.name,
          category: producto.category,
          price: producto.price,
          description: producto.description,
          status: producto.status,
          stock: producto.stock,
          imageUrl: producto.imageUrl || (this.imagenesSeleccionadas[0] ?? ''),
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
    await this.seleccionarImagenes(evento);
  }

  // Si tu input tiene multiple, esto cargará varias. Si no, cargará 1.
  async seleccionarImagenes(evento: Event): Promise<void> {
    this.errorMsg = null;

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

      const dataUrls: string[] = [];
      for (const archivo of archivos) {
        const dataUrl = await this.comprimirImagen(archivo, this.MAX_LADO, this.CALIDAD_JPEG);
        dataUrls.push(dataUrl);
      }

      // Reemplazamos por las nuevas imágenes
      this.imagenesSeleccionadas = dataUrls;

      // principal
      const principal = this.imagenesSeleccionadas[0] ?? '';
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
  quitarImagen(): void {
    this.imagenesSeleccionadas = [];
    this.formulario.patchValue({ imageUrl: '' });
    this.formulario.get('imageUrl')?.markAsTouched();
  }

  // ✅ Tu HTML usa (ngSubmit)="guardar()"
  guardar(): void {
    this.errorMsg = null;

    if (this.formulario.invalid || this.idProducto == null) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const principal = this.imagenesSeleccionadas[0] || this.formulario.value.imageUrl || '';
    const imagesFinal = this.imagenesSeleccionadas.length
      ? this.imagenesSeleccionadas
      : (principal ? [principal] : []);

    const cambios: Omit<Product, 'id'> = {
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
      error: () => {
        this.guardando = false;
        this.errorMsg = 'No se pudieron guardar los cambios.';
      },
    });
  }

  tocado(nombre: string): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.touched && c.invalid;
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
