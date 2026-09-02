import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  role: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  assignKnowledgeBase(userId: string, knowledgeBaseId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/assign-knowledge-base`, { knowledgeBaseId });
  }

  assignConversation(userId: string, conversationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/assign-conversation`, { conversationId });
  }

  getActivityLogs(): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/activity`);
  }
}