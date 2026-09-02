import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.userSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.tokenSubject.next(token);
      this.getCurrentUser().subscribe();
    }
  }

  get currentUserValue(): User | null {
    return this.userSubject.value;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      map(response => {
        localStorage.setItem('token', response.token);
        this.tokenSubject.next(response.token);
        const user: User = {
          id: response.userId,
          email: response.email,
          username: response.username,
          role: response.role
        };
        this.userSubject.next(user);
        return response;
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      map(response => {
        localStorage.setItem('token', response.token);
        this.tokenSubject.next(response.token);
        const user: User = {
          id: response.userId,
          email: response.email,
          username: response.username,
          role: response.role
        };
        this.userSubject.next(user);
        return response;
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      map(user => {
        this.userSubject.next(user);
        return user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'ADMIN';
  }

  checkCurrentUser(): void {
    if (this.tokenSubject.value) {
      this.getCurrentUser().subscribe();
    }
  }
}
