import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBasesService, CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '../core/services/knowledge-bases.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-knowledge-bases',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './knowledge-bases.component.html',
  styleUrls: ['./knowledge-bases.component.css']
})
export class KnowledgeBasesComponent implements OnInit {
  knowledgeBases: KnowledgeBase[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Form state
  showCreateForm = false;
  showEditForm = false;
  editingKnowledgeBase: KnowledgeBase | null = null;
  
  formData = {
    name: '',
    description: ''
  };
  private knowledgeBasesService = inject(KnowledgeBasesService);

  ngOnInit(): void {
    this.loadKnowledgeBases();
  }

  loadKnowledgeBases(): void {
    this.isLoading = true;
    this.error = null;
    this.knowledgeBasesService.getKnowledgeBases()
      .subscribe({
        next: (data) => {
          this.knowledgeBases = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load knowledge bases';
          this.isLoading = false;
          console.error('Error loading knowledge bases:', err);
        }
      });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.formData = { name: '', description: '' };
  }

  openEditForm(kb: KnowledgeBase): void {
    this.showEditForm = true;
    this.showCreateForm = false;
    this.editingKnowledgeBase = kb;
    this.formData = { name: kb.name, description: kb.description || '' };
  }

  closeForms(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.editingKnowledgeBase = null;
    this.formData = { name: '', description: '' };
  }

  createKnowledgeBase(): void {
    if (!this.formData.name.trim()) return;
    
    this.isLoading = true;
    this.knowledgeBasesService.createKnowledgeBase(this.formData)
      .subscribe({
        next: () => {
          this.loadKnowledgeBases();
          this.closeForms();
        },
        error: (err) => {
          this.error = 'Failed to create knowledge base';
          this.isLoading = false;
          console.error('Error creating knowledge base:', err);
        }
      });
  }

  updateKnowledgeBase(): void {
    if (!this.editingKnowledgeBase || !this.formData.name.trim()) return;
    
    this.isLoading = true;
    this.knowledgeBasesService.updateKnowledgeBase(this.editingKnowledgeBase.id, this.formData)
      .subscribe({
        next: () => {
          this.loadKnowledgeBases();
          this.closeForms();
        },
        error: (err) => {
          this.error = 'Failed to update knowledge base';
          this.isLoading = false;
          console.error('Error updating knowledge base:', err);
        }
      });
  }

  deleteKnowledgeBase(id: string): void {
    if (!confirm('Are you sure you want to delete this knowledge base? All collections within it will also be deleted.')) return;
    
    this.isLoading = true;
    this.knowledgeBasesService.deleteKnowledgeBase(id)
      .subscribe({
        next: () => {
          this.loadKnowledgeBases();
        },
        error: (err) => {
          this.error = 'Failed to delete knowledge base';
          this.isLoading = false;
          console.error('Error deleting knowledge base:', err);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
