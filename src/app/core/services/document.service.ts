import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Document {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DocumentUploadResponse {
  documentId: string;
  documentName: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  pages?: number;
  characters?: number;
  chunks?: number;
  uploadSuccess: boolean;
}

export interface DocumentMetadata {
  documentId: string;
  documentName: string;
  documentHash: string;
  chunkCount: number;
  fileSize: number;
  pages: number;
  characters: number;
  uploadedAt: Date;
  indexedAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  chunkCount: number;
  embeddingModel: string;
  createdAt: Date;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/api/documents`;
  private maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
  private allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  private allowedExtensions = ['.pdf', '.txt', '.docx'];

  constructor(private http: HttpClient) {}

  getDocuments(): Observable<DocumentMetadata[]> {
    return this.http.get<DocumentMetadata[]>(this.apiUrl);
  }

  uploadDocument(file: File, knowledgeBaseId?: string, collectionId?: string): Observable<DocumentUploadResponse> {
    // Validate file before upload
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledgeBaseId', knowledgeBaseId);
    }
    if (collectionId) {
      formData.append('collectionId', collectionId);
    }
    return this.http.post<DocumentUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDocumentMetadata(id: string): Observable<DocumentMetadata> {
    return this.http.get<DocumentMetadata>(`${this.apiUrl}/${id}/metadata`);
  }

  getDocumentVersion(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/version`);
  }

  getDocumentVersions(documentId: string): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(`${this.apiUrl}/${documentId}/versions`);
  }

  restoreDocumentVersion(versionId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/versions/${versionId}/restore`, {});
  }

  reindexDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reindex`, {});
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed (50MB)`,
      };
    }

    // Check file type
    const fileExtension = this.getFileExtension(file.name);
    if (!this.allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: PDF, TXT, DOCX. Got: ${fileExtension}`,
      };
    }

    // Check MIME type
    if (!this.allowedTypes.includes(file.type) && file.type !== '') {
      console.warn(`Unexpected MIME type: ${file.type}, but allowing based on extension`);
    }

    return { valid: true };
  }

  private getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
