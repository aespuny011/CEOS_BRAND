import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  errorMsg: string | null = null;
  loading = false;

  formulario = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  get nameControl() {
    return this.formulario.get('name');
  }

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
      .register({
        name: this.formulario.value.name!,
        email: this.formulario.value.email!,
        password: this.formulario.value.password!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/productos']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMsg = error?.error?.message ?? 'No se pudo crear la cuenta.';
        },
      });
  }

  getFieldError(field: 'name' | 'email' | 'password'): string | null {
    const control = this.formulario.get(field);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      if (field === 'name') return 'El nombre es obligatorio.';
      if (field === 'email') return 'El email es obligatorio.';
      return 'La contraseña es obligatoria.';
    }

    if (control.errors['minlength']) {
      if (field === 'name') return 'El nombre debe tener al menos 2 caracteres.';
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (control.errors['email']) {
      return 'Introduce un email válido.';
    }

    return null;
  }
}
