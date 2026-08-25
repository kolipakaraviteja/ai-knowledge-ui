import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ChatService, Conversation } from '../core/services/chat.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  private chatService = inject(ChatService);
  private router = inject(Router);
  
  recentConversations: Conversation[] = [];
  loading = false;
  showConversations = true;
  showKnowledgeBases = false;

  ngOnInit(): void {
    this.loadRecentConversations();
  }

  toggleKnowledgeBases(): void {
    this.showKnowledgeBases = !this.showKnowledgeBases;
  }

  loadRecentConversations(): void {
    this.loading = true;
    this.chatService.getAllConversations().subscribe({
      next: (conversations) => {
        // Get the 5 most recent conversations
        this.recentConversations = conversations
          .sort((a, b) => new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime())
          .slice(0, 5);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recent conversations:', err);
        this.loading = false;
      }
    });
  }

  openConversation(conversationId: string): void {
    this.router.navigate(['/chat-hub'], { queryParams: { tab: 'chat', conversationId } });
  }

  toggleConversations(): void {
    this.showConversations = !this.showConversations;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}
