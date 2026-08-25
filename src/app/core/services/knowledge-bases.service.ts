
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBasesService {
  private apiUrl = `${environment.apiUrl}/api/knowledge-bases`;

  constructor(private http: HttpClient) {}

  /**
   * Get all knowledge bases
   */
  getKnowledgeBases(): Observable<KnowledgeBase[]> {
    return this.http.get<KnowledgeBase[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Error fetching knowledge bases:', err);
        return throwError(() => new Error('Failed to load knowledge bases'));
      })
    );
  }

  /**
   * Create a new knowledge base
   */
  createKnowledgeBase(request: CreateKnowledgeBaseRequest): Observable<KnowledgeBase> {
    const params = new HttpParams()
    .set('name', request.name)
    .set('description', request.description || '');

    return this.http.post<KnowledgeBase>(this.apiUrl, request, { params }).pipe(
      catchError((err) => {
        console.error('Error creating knowledge base:', err);
        return throwError(() => new Error('Failed to create knowledge base'));
      })
    );
  }

  /**
   * Update an existing knowledge base
   */
  updateKnowledgeBase(id: string, request: UpdateKnowledgeBaseRequest): Observable<KnowledgeBase> {
    const params = new HttpParams()
    .set('name', request.name)
    .set('description', request.description || '');

    return this.http.put<KnowledgeBase>(`${this.apiUrl}/${id}`, request, { params }).pipe(
      catchError((err) => {
        console.error('Error updating knowledge base:', err);
        return throwError(() => new Error('Failed to update knowledge base'));
      })
    );
  }

  /**
   * Delete a knowledge base
   */
  deleteKnowledgeBase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('Error deleting knowledge base:', err);
        return throwError(() => new Error('Failed to delete knowledge base'));
      })
    );
  }
}