import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth.service';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  loading = false;
  passwordLoading = false;
  successMsg = '';
  errorMsg = '';
  passwordSuccessMsg = '';
  passwordErrorMsg = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, this.passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordsMatchValidator });

  constructor(public authService: AuthService, private fb: FormBuilder) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.profileForm.patchValue({ name: user.name, email: user.email });
      return;
    }

    this.authService.restoreSession().subscribe((isLoggedIn) => {
      const restoredUser = this.authService.currentUser;
      if (isLoggedIn && restoredUser) {
        this.profileForm.patchValue({ name: restoredUser.name, email: restoredUser.email });
      }
    });
  }

  save(): void {
    this.successMsg = '';
    this.errorMsg = '';
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      this.errorMsg = 'Revisa tu nombre y tu email.';
      return;
    }

    this.loading = true;
    this.authService.updateProfile({
      name: this.profileForm.value.name || '',
      email: this.profileForm.value.email || '',
    }).subscribe({
      next: () => {
        this.successMsg = 'Perfil actualizado correctamente.';
        this.loading = false;
      },
      error: (error) => {
        this.errorMsg = error?.error?.message || 'No se pudo actualizar el perfil.';
        this.loading = false;
      },
    });
  }

  savePassword(): void {
    this.passwordSuccessMsg = '';
    this.passwordErrorMsg = '';
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid) {
      this.passwordErrorMsg = 'Revisa los campos de contraseña.';
      return;
    }

    this.passwordLoading = true;
    this.authService.updatePassword({
      currentPassword: this.passwordForm.value.currentPassword || '',
      newPassword: this.passwordForm.value.newPassword || '',
    }).subscribe({
      next: () => {
        this.passwordSuccessMsg = 'Contraseña actualizada correctamente.';
        this.passwordForm.reset();
        this.passwordLoading = false;
      },
      error: (error) => {
        this.passwordErrorMsg = error?.error?.message || 'No se pudo actualizar la contraseña.';
        this.passwordLoading = false;
      },
    });
  }

  togglePasswordVisibility(field: PasswordField): void {
    if (field === 'currentPassword') {
      this.showCurrentPassword = !this.showCurrentPassword;
    }

    if (field === 'newPassword') {
      this.showNewPassword = !this.showNewPassword;
    }

    if (field === 'confirmPassword') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  isInvalid(formControlName: 'name' | 'email'): boolean {
    const control = this.profileForm.controls[formControlName];
    return control.invalid && (control.dirty || control.touched);
  }

  isPasswordInvalid(controlName: PasswordField): boolean {
    const control = this.passwordForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  showPasswordMismatch(): boolean {
    const confirmControl = this.passwordForm.controls.confirmPassword;
    return this.passwordForm.hasError('passwordMismatch') && (confirmControl.dirty || confirmControl.touched);
  }

  getPasswordErrors(): string[] {
    const control = this.passwordForm.controls.newPassword;

    if (!control.touched || !control.errors) {
      return [];
    }

    const errors = control.errors;
    const messages: string[] = [];

    if (errors['required']) {
      messages.push('La nueva contraseña es obligatoria.');
      return messages;
    }

    if (errors['passwordMinLength']) messages.push('Debe tener al menos 8 caracteres.');
    if (errors['passwordUppercase']) messages.push('Debe incluir al menos una letra mayúscula.');
    if (errors['passwordLowercase']) messages.push('Debe incluir al menos una letra minúscula.');
    if (errors['passwordNumber']) messages.push('Debe incluir al menos un número.');
    if (errors['passwordSpecial']) messages.push('Debe incluir al menos un símbolo.');
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

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
}
