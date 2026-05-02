import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
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
    password: ['', [Validators.required, this.passwordStrengthValidator]],
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
      return null;
    }

    if (control.errors['email']) {
      return 'Introduce un email válido.';
    }

    return null;
  }

  getPasswordErrors(): string[] {
    const control = this.passwordControl;

    if (!control || !control.touched || !control.errors) {
      return [];
    }

    const errors = control.errors;
    const messages: string[] = [];

    if (errors['required']) {
      messages.push('La contrasena es obligatoria.');
      return messages;
    }

    if (errors['passwordMinLength']) messages.push('Debe tener al menos 8 caracteres.');
    if (errors['passwordUppercase']) messages.push('Debe incluir al menos una letra mayuscula.');
    if (errors['passwordLowercase']) messages.push('Debe incluir al menos una letra minuscula.');
    if (errors['passwordNumber']) messages.push('Debe incluir al menos un numero.');
    if (errors['passwordSpecial']) messages.push('Debe incluir al menos un simbolo.');
    if (errors['passwordSpaces']) messages.push('No puede contener espacios.');

    return messages;
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '');

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) errors['passwordMinLength'] = true;
    if (!/[A-Z]/.test(value)) errors['passwordUppercase'] = true;
    if (!/[a-z]/.test(value)) errors['passwordLowercase'] = true;
    if (!/\d/.test(value)) errors['passwordNumber'] = true;
    if (!/[^A-Za-z0-9\s]/.test(value)) errors['passwordSpecial'] = true;
    if (/\s/.test(value)) errors['passwordSpaces'] = true;

    return Object.keys(errors).length ? errors : null;
  }
}
