import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-create',
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.scss'],
})
export class ProductCreateComponent {
  saving = false;
  errorMsg: string | null = null;

  categories: Product['category'][] = ['Camiseta', 'Sudadera', 'Pantalón', 'Accesorio', 'Chaqueta'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['Camiseta' as Product['category'], [Validators.required]],
    price: [29.99, [Validators.required]],
    imageUrl: ['assets/img/ceos-tee.svg', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(private fb: FormBuilder, private productService: ProductService, private router: Router) {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.errorMsg = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    const payload = this.form.value as Omit<Product, 'id'>;

    this.productService.addProduct(payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.router.navigate(['/productos', created.id]);
      },
      error: (err: Error) => {
        this.errorMsg = err.message;
        this.saving = false;
      },
    });
  }
}
