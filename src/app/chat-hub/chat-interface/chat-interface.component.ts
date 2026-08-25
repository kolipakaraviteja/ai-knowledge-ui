import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, ChatResponse } from '../../core/services/chat.service';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { KnowledgeBasesService } from '../../core/services/knowledge-bases.service';
import { CollectionsService } from '../../core/services/collections.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './chat-interface.component.html',
  styleUrls: ['./chat-interface.component.css'],
})
export class ChatInterfaceComponent implements OnInit {
  private chatService = inject(ChatService);
  private sanitizer = inject(DomSanitizer);
  private clipboard = inject(Clipboard);
  private http = inject(HttpClient);
  private knowledgeBasesService = inject(KnowledgeBasesService);
  private collectionsService = inject(CollectionsService);

  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  errorMessage = '';
  conversationId = '';
  conversationTitle = 'New Conversation';
  useStreaming = true;
  expandedCitations: Set<string> = new Set();
  followUpQuestions: string[] = [];
  showFollowUp = false;
  
  // Knowledge base and collection selection
  knowledgeBases: KnowledgeBase[] = [];
  collections: Collection[] = [];
  selectedKnowledgeBaseId: string | null = null;
  selectedCollectionId: string | null = null;

  ngOnInit(): void {
    this.startNewConversation();
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

  startNewConversation(): void {
    this.chatService.startConversation().subscribe({
      next: (response) => {
        this.conversationId = response.conversationId;
        this.messages = [];
        this.conversationTitle = 'New Conversation';
        this.followUpQuestions = [];
        this.showFollowUp = false;
        console.log('New conversation started:', this.conversationId);
      },
      error: (error) => {
        console.error('Failed to start conversation:', error);
        this.errorMessage = 'Failed to start conversation. Is the backend running?';
      },
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }

    const userMessage = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;
    this.errorMessage = '';
    this.showFollowUp = false;

    // Add user message to display
    this.messages.push({
      id: Date.now().toString(),
      content: userMessage,
      timestamp: new Date(),
      sender: 'user',
    });

    // Use RAG chat with knowledge base and collection filtering
    this.chatService.ragChat(
      userMessage,
      5,
      this.selectedKnowledgeBaseId || undefined,
      this.selectedCollectionId || undefined
    ).subscribe({
      next: (response: ChatResponse) => {
        // Add assistant response
        this.messages.push({
          id: (Date.now() + 1).toString(),
          content: response.answer,
          timestamp: new Date(),
          sender: 'assistant',
          citations: this.extractCitations(response),
        });
        this.isLoading = false;
        this.generateFollowUpQuestions();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
        this.errorMessage =
          error.status === 0
            ? 'Connection failed. Backend is not running at http://localhost:8080'
            : `Error: ${error.status} - ${error.statusText}`;
      },
    });
  }

  regenerateResponse(): void {
    if (!this.conversationId || this.messages.length < 2) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Remove the last assistant message
    this.messages.pop();

    this.chatService.regenerateResponse(this.conversationId).subscribe({
      next: (response: ChatResponse) => {
        // Add regenerated assistant response
        this.messages.push({
          id: (Date.now() + 1).toString(),
          content: response.answer,
          timestamp: new Date(),
          sender: 'assistant',
          citations: this.extractCitations(response),
        });
        this.isLoading = false;
        this.generateFollowUpQuestions();
      },
      error: (error) => {
        console.error('Error regenerating response:', error);
        this.isLoading = false;
        this.errorMessage = 'Failed to regenerate response';
      },
    });
  }

  generateFollowUpQuestions(): void {
    if (!this.conversationId) {
      return;
    }

    this.chatService.generateFollowUpQuestions(this.conversationId).subscribe({
      next: (questions: string[]) => {
        this.followUpQuestions = questions;
        this.showFollowUp = questions.length > 0;
      },
      error: (error) => {
        console.error('Error generating follow-up questions:', error);
        this.showFollowUp = false;
      },
    });
  }

  selectFollowUpQuestion(question: string): void {
    this.newMessage = question;
    this.sendMessage();
  }

  copyToClipboard(text: string): void {
    this.clipboard.copy(text);
  }

  private extractCitations(response: ChatResponse): Citation[] {
    const citations: Citation[] = [];
    if (response.sourceDocuments) {
      response.sourceDocuments.forEach((doc) => {
        if (doc.citations) {
          citations.push(...doc.citations);
        }
      });
    }
    return citations;
  }

  parseMarkdown(content: string): string {
    return marked.parse(content) as string;
  }

  toggleCitation(citationId: string): void {
    if (this.expandedCitations.has(citationId)) {
      this.expandedCitations.delete(citationId);
    } else {
      this.expandedCitations.add(citationId);
    }
  }

  isCitationExpanded(citationId: string): boolean {
    return this.expandedCitations.has(citationId);
  }

  getCitationId(citation: Citation, index: number): string {
    return `${citation.documentId}-${citation.chunkIndex}-${index}`;
  }
}

interface Citation {
  documentName: string;
  documentId: string;
  pageNumber?: number;
  chunkIndex?: number;
  relevanceScore?: number;
  content: string;
}
