import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  errorMsg: string | null = null;
  loading = false;

  formulario = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  get emailControl() {
    return this.formulario.get('email');
  }

  get passwordControl() {
    return this.formulario.get('password');
  }

  enviar(): void {
    this.errorMsg = null;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .login({
        email: this.formulario.value.email!,
        password: this.formulario.value.password!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.cartService.refresh().subscribe();
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMsg = error?.error?.message ?? 'No se pudo iniciar sesion.';
        },
      });
  }

  getFieldError(field: 'email' | 'password'): string | null {
    const control = this.formulario.get(field);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return field === 'email' ? 'El email es obligatorio.' : 'La contraseña es obligatoria.';
    }

    if (control.errors['email']) {
      return 'Introduce un email válido.';
    }

    if (control.errors['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return null;
  }
}
