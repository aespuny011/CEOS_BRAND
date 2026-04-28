import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, map } from 'rxjs';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (this.authService.currentUser) {
      return of(true);
    }

    return this.authService.restoreSession().pipe(
      map((isLoggedIn) => (isLoggedIn ? true : this.router.createUrlTree(['/login'])))
    );
  }
}
