import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { AuthUser } from '../models/auth-user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiBaseUrl = 'http://localhost:8080/api/auth';
  private readonly adminEmail = 'admin@gmail.com';
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);

  readonly user$ = this.userSubject.asObservable();
  readonly isLoggedIn$ = this.user$.pipe(map((user) => !!user));

  constructor(private http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.email?.toLowerCase() === this.adminEmail;
  }

  register(payload: { name: string; email: string; password: string }): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.apiBaseUrl}/register`, payload, { withCredentials: true })
      .pipe(tap((user) => this.userSubject.next(user)));
  }

  login(payload: { email: string; password: string }): Observable<AuthUser> {
    return this.http
      .post<AuthUser>(`${this.apiBaseUrl}/login`, payload, { withCredentials: true })
      .pipe(tap((user) => this.userSubject.next(user)));
  }

  logout(): Observable<void> {
    return this.http
      .post<{ message: string }>(
        `${this.apiBaseUrl}/logout`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(() => this.userSubject.next(null)),
        map(() => void 0)
      );
  }

  restoreSession(): Observable<boolean> {
    return this.http
      .get<AuthUser>(`${this.apiBaseUrl}/me`, { withCredentials: true })
      .pipe(
        tap((user) => this.userSubject.next(user)),
        map(() => true),
        catchError(() => {
          this.userSubject.next(null);
          return of(false);
        })
      );
  }
}
