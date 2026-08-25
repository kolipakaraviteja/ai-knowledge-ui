import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentMetadata, DocumentService, DocumentUploadResponse, DocumentVersion } from '../../core/services/document.service';
import { Observable } from 'rxjs';
import { CollectionsService } from '../../core/services/collections.service';
import { KnowledgeBasesService } from '../../core/services/knowledge-bases.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdvancedSearchComponent, AdvancedSearchParams } from '../../shared/advanced-search/advanced-search.component';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}

interface Collection {
  id: string;
  knowledgeBaseId: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    AdvancedSearchComponent
  ],
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css'],
})
export class DocumentsListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private collectionsService = inject(CollectionsService);
  private knowledgeBasesService = inject(KnowledgeBasesService);
  private dialog = inject(MatDialog);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  documents$!: Observable<DocumentMetadata[]>;
  selectedFile: File | null = null;
  isUploading = false;
  validationError = '';
  uploadError = '';
  uploadSuccess = '';
  
  // Knowledge base and collection selection
  knowledgeBases: KnowledgeBase[] = [];
  collections: Collection[] = [];
  selectedKnowledgeBaseId: string | null = null;
  selectedCollectionId: string | null = null;
  
  // Search and filter
  searchQuery = '';
  
  // Version history
  showVersionHistory = false;
  selectedDocumentVersions: DocumentVersion[] = [];
  selectedDocumentName = '';

  // Upload success modal
  showUploadSuccess = false;
  uploadSuccessData: { documentName: string; chunks: number; fileSize: number } | null = null;

  displayedColumns: string[] = ['name', 'size', 'pages', 'chunks', 'uploaded', 'actions'];

  ngOnInit(): void {
    this.loadDocuments();
    this.loadKnowledgeBases();
  }

  loadDocuments(): void {
    this.documents$ = this.documentService.getDocuments();
  }

  loadKnowledgeBases(): void {
    this.knowledgeBasesService.getKnowledgeBases()
      .subscribe({
        next: (data) => {
          this.knowledgeBases = data;
        },
        error: (err) => {
          console.error('Error loading knowledge bases:', err);
        }
      });
  }

  loadCollections(kbId: string): void {
    this.collectionsService.getCollectionsByKnowledgeBase(kbId)
      .subscribe({
        next: (data) => {
          this.collections = data;
        },
        error: (err) => {
          console.error('Error loading collections:', err);
        }
      });
  }

  onKnowledgeBaseChange(event: any): void {
    const kbId = event.value || event.target?.value;
    this.selectedKnowledgeBaseId = kbId || null;
    this.selectedCollectionId = null;
    this.collections = [];
    if (kbId) {
      this.loadCollections(kbId);
    }
  }

  onCollectionChange(event: any): void {
    const collectionId = event.value || event.target?.value;
    this.selectedCollectionId = collectionId || null;
  }

  onAdvancedSearch(params: AdvancedSearchParams): void {
    console.log('Advanced search params:', params);
    this.searchQuery = params.query;
    this.loadDocuments();
  }

  loadVersionHistory(documentId: string, documentName: string): void {
    this.documentService.getDocumentVersions(documentId)
      .subscribe({
        next: (data) => {
          this.selectedDocumentVersions = data;
          this.selectedDocumentName = documentName;
          this.showVersionHistory = true;
        },
        error: (err) => {
          console.error('Error loading version history:', err);
          this.uploadError = 'Failed to load version history';
        }
      });
  }

  closeVersionHistory(): void {
    this.showVersionHistory = false;
    this.selectedDocumentVersions = [];
    this.selectedDocumentName = '';
  }

  openUploadSuccessModal(documentName: string, chunks: number, fileSize?: number): void {
    this.uploadSuccessData = { documentName, chunks, fileSize: fileSize ?? 0 };
    this.showUploadSuccess = true;
  }

  closeUploadSuccessModal(): void {
    this.showUploadSuccess = false;
    this.uploadSuccessData = null;
  }

  restoreVersion(versionId: string): void {
    if (!confirm('Are you sure you want to restore this version? This will set it as the active version.')) return;
    
    this.documentService.restoreDocumentVersion(versionId)
      .subscribe({
        next: () => {
          this.loadDocuments();
          this.closeVersionHistory();
          this.uploadSuccess = 'Version restored successfully';
        },
        error: (err) => {
          console.error('Error restoring version:', err);
          this.uploadError = 'Failed to restore version';
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validationError = '';
    this.uploadError = '';

    if (input.files?.length) {
      const file = input.files[0];
      const validation = this.documentService.validateFile(file);

      if (!validation.valid) {
        this.validationError = validation.error || 'Invalid file';
        this.selectedFile = null;
      } else {
        this.selectedFile = file;
      }
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.validationError = 'Please select a file';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    this.documentService.uploadDocument(this.selectedFile, this.selectedKnowledgeBaseId || undefined, this.selectedCollectionId || undefined).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.selectedFile = null;
        this.validationError = '';
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.openUploadSuccessModal(response.documentName, response.chunks || 0, response.fileSize);
        this.loadDocuments();
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Upload error:', error);
        this.uploadError =
          error.status === 0
            ? 'Connection failed. Backend is not running at http://localhost:8080'
            : error.error?.message || `Upload failed: ${error.status} ${error.statusText}`;
      },
    });
  }

  deleteDocument(id: string): void {
    if (confirm('Are you sure you want to delete this document?')) {
      this.documentService.deleteDocument(id).subscribe({
        next: () => {
          this.loadDocuments();
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.uploadError = 'Failed to delete document';
        },
      });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
