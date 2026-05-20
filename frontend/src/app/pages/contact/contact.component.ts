import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';

type ContactControlName = 'name' | 'email' | 'subject' | 'message';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  sending = false;
  successMsg: string | null = null;
  errorMsg: string | null = null;

  contactForm = this.fb.group({
    name: [this.authService.currentUser?.name ?? '', [Validators.required, Validators.maxLength(80)]],
    email: [this.authService.currentUser?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(120)]],
    subject: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    public authService: AuthService
  ) {}

  submit(): void {
    this.successMsg = null;
    this.errorMsg = null;
    this.contactForm.markAllAsTouched();

    if (this.contactForm.invalid || this.sending) {
      return;
    }

    this.sending = true;
    const payload = this.contactForm.getRawValue();

    this.contactService.sendMessage({
      name: payload.name ?? '',
      email: payload.email ?? '',
      subject: payload.subject ?? '',
      message: payload.message ?? '',
    }).subscribe({
      next: () => {
        this.successMsg = 'Mensaje enviado correctamente. Te responderemos lo antes posible.';
        this.contactForm.patchValue({ subject: '', message: '' });
        this.contactForm.markAsPristine();
        this.contactForm.markAsUntouched();
        this.sending = false;
      },
      error: (error) => {
        this.errorMsg = error?.error?.message ?? 'No se pudo enviar el mensaje. Inténtalo más tarde.';
        this.sending = false;
      },
    });
  }

  isInvalid(controlName: ContactControlName): boolean {
    const control = this.contactForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
