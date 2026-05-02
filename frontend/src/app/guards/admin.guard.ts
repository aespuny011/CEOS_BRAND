import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (this.authService.currentUser) {
      return of(this.authService.isAdmin ? true : this.router.createUrlTree(['/productos']));
    }

    return this.authService.restoreSession().pipe(
      map((isLoggedIn) =>
        isLoggedIn && this.authService.isAdmin ? true : this.router.createUrlTree(['/login'])
      )
    );
  }
}
