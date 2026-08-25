import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBasesService } from '../../core/services/knowledge-bases.service';
import { CollectionsService, CreateCollectionRequest, UpdateCollectionRequest } from '../../core/services/collections.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';

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
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule
  ],
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.css']
})
export class CollectionsListComponent implements OnInit {
  knowledgeBases: KnowledgeBase[] = [];
  collections: Collection[] = [];
  selectedKnowledgeBaseId: string | null = null;
  selectedCollectionId: string | null = null;
  isLoading = false;
  error: string | null = null;
  
  // Form state
  showCreateForm = false;
  showEditForm = false;
  editingCollection: Collection | null = null;
  
  formData = {
    knowledgeBaseId: '',
    name: '',
    description: ''
  };

  private knowledgeBasesService = inject(KnowledgeBasesService);
  private collectionsService = inject(CollectionsService);

  ngOnInit(): void {
    this.loadKnowledgeBases();
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
    this.isLoading = true;
    this.error = null;
    this.collectionsService.getCollectionsByKnowledgeBase(kbId)
      .subscribe({
        next: (data) => {
          this.collections = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load collections';
          this.isLoading = false;
          console.error('Error loading collections:', err);
        }
      });
  }

  onKnowledgeBaseChange(event: any): void {
    const kbId = event.value || event;
    this.selectedKnowledgeBaseId = kbId || null;
    this.selectedCollectionId = null;
    this.collections = [];
    if (kbId) {
      this.loadCollections(kbId);
    } else {
      this.collections = [];
    }
  }

  openCreateForm(): void {
    if (!this.selectedKnowledgeBaseId) {
      this.error = 'Please select a knowledge base first';
      return;
    }
    this.showCreateForm = true;
    this.showEditForm = false;
    this.formData = { 
      knowledgeBaseId: this.selectedKnowledgeBaseId, 
      name: '', 
      description: '' 
    };
  }

  openEditForm(collection: Collection): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingCollection = collection;
    this.formData = { 
      knowledgeBaseId: collection.knowledgeBaseId, 
      name: collection.name, 
      description: collection.description || '' 
    };
  }

  closeForms(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingCollection = null;
    this.formData = { knowledgeBaseId: '', name: '', description: '' };
  }

  createCollection(): void {
    if (!this.formData.name.trim() || !this.formData.knowledgeBaseId) return;
    
    this.isLoading = true;
    this.collectionsService.createCollection(this.formData as CreateCollectionRequest)
      .subscribe({
        next: () => {
          this.loadCollections(this.formData.knowledgeBaseId);
          this.closeForms();
        },
        error: (err) => {
          this.error = 'Failed to create collection';
          this.isLoading = false;
          console.error('Error creating collection:', err);
        }
      });
  }

  updateCollection(): void {
    if (!this.editingCollection || !this.formData.name.trim()) return;
    
    this.isLoading = true;
    this.collectionsService.updateCollection(this.editingCollection.id, this.formData as UpdateCollectionRequest)
      .subscribe({
        next: () => {
          this.loadCollections(this.editingCollection!.knowledgeBaseId);
          this.closeForms();
        },
        error: (err) => {
          this.error = 'Failed to update collection';
          this.isLoading = false;
          console.error('Error updating collection:', err);
        }
      });
  }

  deleteCollection(id: string): void {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    
    this.isLoading = true;
    this.collectionsService.deleteCollection(id)
      .subscribe({
        next: () => {
          if (this.selectedKnowledgeBaseId) {
            this.loadCollections(this.selectedKnowledgeBaseId);
          }
        },
        error: (err) => {
          this.error = 'Failed to delete collection';
          this.isLoading = false;
          console.error('Error deleting collection:', err);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getKnowledgeBaseName(kbId: string): string {
    const kb = this.knowledgeBases.find(k => k.id === kbId);
    return kb ? kb.name : 'Unknown';
  }
}
