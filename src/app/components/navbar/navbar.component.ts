import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isVisible = true;
  lastScrollY = 0;
  private scrollTimeout: any;
  private readonly SCROLL_SENSITIVITY = 5;

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.lastScrollY = window.scrollY;
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  @HostListener('window:scroll',)
  onWindowScroll(): void {
    const currentScrollY = window.scrollY;

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      const scrollDifference = currentScrollY - this.lastScrollY;

      if (Math.abs(scrollDifference) > this.SCROLL_SENSITIVITY) {
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
}