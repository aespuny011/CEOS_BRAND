import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isVisible = true;
  lastScrollY = 0;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly scrollSensitivity = 5;

  constructor(
    public router: Router,
    public authService: AuthService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.lastScrollY = window.scrollY;
    this.authService.restoreSession().subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        this.cartService.refresh().subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY;

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const scrollDifference = currentScrollY - this.lastScrollY;

      if (Math.abs(scrollDifference) > this.scrollSensitivity) {
        if (scrollDifference > 0 && currentScrollY > 50) {
          this.isVisible = false;
        } else if (scrollDifference < 0) {
          this.isVisible = true;
        }
      }

      if (currentScrollY < 10) {
        this.isVisible = true;
      }

      this.lastScrollY = currentScrollY;
    }, 10);
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.cartService.refresh().subscribe();
        this.router.navigate(['/login']);
      },
    });
  }
}
