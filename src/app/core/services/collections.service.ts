

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Collection {
  id: string;
  knowledgeBaseId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  knowledgeBaseId: string;
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private apiUrl = `${environment.apiUrl}/api/collections`;
  private kbApiUrl = `${environment.apiUrl}/api/knowledge-bases`;

  constructor(private http: HttpClient) {}

  /**
   * Get all collections
   */
  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Error fetching collections:', err);
        return throwError(() => new Error('Failed to load collections'));
      })
    );
  }

  /**
   * Get collections for a specific knowledge base
   */
  getCollectionsByKnowledgeBase(knowledgeBaseId: string): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${this.apiUrl}/knowledge-base/${knowledgeBaseId}`).pipe(
      catchError((err) => {
        console.error('Error fetching collections for knowledge base:', err);
        return throwError(() => new Error('Failed to load collections'));
      })
    );
  }

  /**
   * Create a new collection
   */
  createCollection(request: CreateCollectionRequest): Observable<Collection> {
    const params = new HttpParams()
    .set('knowledgeBaseId', request.knowledgeBaseId)
    .set('name', request.name)
    .set('description', request.description || '');

    return this.http.post<Collection>(this.apiUrl,  params ).pipe(
      catchError((err) => {
        console.error('Error creating collection:', err);
        return throwError(() => new Error('Failed to create collection'));
      })
    );
  }

  /**
   * Update an existing collection
   */
  updateCollection(id: string, request: UpdateCollectionRequest): Observable<Collection> {
    return this.http.put<Collection>(`${this.apiUrl}/${id}`, request).pipe(
      catchError((err) => {
        console.error('Error updating collection:', err);
        return throwError(() => new Error('Failed to update collection'));
      })
    );
  }

  /**
   * Delete a collection
   */
  deleteCollection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('Error deleting collection:', err);
        return throwError(() => new Error('Failed to delete collection'));
      })
    );
  }
}