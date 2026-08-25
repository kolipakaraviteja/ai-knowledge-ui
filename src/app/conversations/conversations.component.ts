import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Conversation } from '../core/services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css'],
})
export class ConversationsComponent implements OnInit {
  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  searchQuery: string = '';
  loading = false;
  error: string | null = null;
  
  // Edit state
  showEditModal = false;
  editingConversation: Conversation | null = null;
  editTitle = '';

  // Dropdown state
  activeDropdown: string | null = null;

  constructor(
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading = true;
    this.error = null;
    this.chatService.getAllConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.filteredConversations = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load conversations';
        this.loading = false;
        console.error('Error loading conversations:', err);
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = this.conversations;
      return;
    }

    this.loading = true;
    this.chatService.searchConversations(this.searchQuery).subscribe({
      next: (data) => {
        this.filteredConversations = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to search conversations';
        this.loading = false;
        console.error('Error searching conversations:', err);
      }
    });
  }

  openEditModal(conversation: Conversation): void {
    this.editingConversation = conversation;
    this.editTitle = conversation.title;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingConversation = null;
    this.editTitle = '';
  }

  saveTitle(): void {
    if (!this.editingConversation || !this.editTitle.trim()) return;
    
    this.chatService.renameConversation(this.editingConversation.id, this.editTitle).subscribe({
      next: () => {
        this.editingConversation!.title = this.editTitle;
        this.closeEditModal();
        this.loadConversations();
      },
      error: (err) => {
        this.error = 'Failed to rename conversation';
        console.error('Error renaming conversation:', err);
      }
    });
  }

  exportConversation(conversationId: string, format: 'json' | 'markdown'): void {
    this.chatService.exportConversation(conversationId, format).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversationId}.${format === 'json' ? 'json' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = 'Failed to export conversation';
        console.error('Error exporting conversation:', err);
      }
    });
  }

  duplicateConversation(conversationId: string): void {
    this.chatService.duplicateConversation(conversationId).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (err) => {
        this.error = 'Failed to duplicate conversation';
        console.error('Error duplicating conversation:', err);
      }
    });
  }

  archiveConversation(conversationId: string): void {
    if (!confirm('Are you sure you want to archive this conversation?')) return;
    
    this.chatService.archiveConversation(conversationId).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (err) => {
        this.error = 'Failed to archive conversation';
        console.error('Error archiving conversation:', err);
      }
    });
  }

  pinConversation(conversationId: string): void {
    this.chatService.pinConversation(conversationId).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (err) => {
        this.error = 'Failed to pin conversation';
        console.error('Error pinning conversation:', err);
      }
    });
  }

  deleteConversation(conversationId: string): void {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    this.chatService.deleteConversation(conversationId).subscribe({
      next: () => {
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        this.filteredConversations = this.filteredConversations.filter(c => c.id !== conversationId);
      },
      error: (err) => {
        this.error = 'Failed to delete conversation';
        console.error('Error deleting conversation:', err);
      }
    });
  }

  openConversation(conversationId: string): void {
    this.router.navigate(['/chat'], { queryParams: { conversationId } });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  toggleDropdown(conversationId: string): void {
    this.activeDropdown = this.activeDropdown === conversationId ? null : conversationId;
  }

  closeDropdown(): void {
    this.activeDropdown = null;
  }
}
