import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, ChatResponse } from '../core/services/chat.service';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { KnowledgeBasesService } from '../core/services/knowledge-bases.service';
import { CollectionsService } from '../core/services/collections.service';

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
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
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
  
  // Conversation history
  conversations: Conversation[] = [];
  showConversationHistory = false;
  editingTitle = false;
  
  // Knowledge base and collection selection
  knowledgeBases: KnowledgeBase[] = [];
  collections: Collection[] = [];
  selectedKnowledgeBaseId: string | null = null;
  selectedCollectionId: string | null = null;

  ngOnInit(): void {
    this.startNewConversation();
    this.loadKnowledgeBases();
    this.loadConversationHistory();
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

  onKnowledgeBaseChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const kbId = select.value;
    this.selectedKnowledgeBaseId = kbId || null;
    this.selectedCollectionId = null;
    this.collections = [];
    if (kbId) {
      this.loadCollections(kbId);
    }
  }

  onCollectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const collectionId = select.value;
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

  loadConversationHistory(): void {
    this.chatService.getAllConversations().subscribe({
      next: (conversations: any[]) => {
        this.conversations = conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          lastActivity: conv.lastActivity ? new Date(conv.lastActivity) : new Date(conv.createdAt)
        }));
      },
      error: (err: any) => {
        console.error('Error loading conversation history:', err);
      }
    });
  }

  loadConversation(conversationId: string): void {
    // Since getConversation doesn't exist in the service, we'll start a new conversation
    // In a real implementation, you would need to add this method to the backend service
    console.log('Loading conversation:', conversationId);
    this.conversationId = conversationId;
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      this.conversationTitle = conversation.title;
    }
    this.showConversationHistory = false;
    // Note: Messages would need to be loaded from the backend in a real implementation
    this.messages = [];
  }

  deleteConversation(conversationId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.chatService.deleteConversation(conversationId).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(c => c.id !== conversationId);
          if (this.conversationId === conversationId) {
            this.startNewConversation();
          }
        },
        error: (err: any) => {
          console.error('Error deleting conversation:', err);
        }
      });
    }
  }

  updateConversationTitle(): void {
    if (this.conversationId && this.conversationTitle) {
      this.chatService.renameConversation(this.conversationId, this.conversationTitle).subscribe({
        next: () => {
          this.loadConversationHistory();
        },
        error: (err: any) => {
          console.error('Error updating conversation title:', err);
        }
      });
    }
  }

  toggleConversationHistory(): void {
    this.showConversationHistory = !this.showConversationHistory;
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

    // Use streaming if enabled
    if (this.useStreaming) {
      this.sendStreamingMessage(userMessage);
    } else {
      this.sendRegularMessage(userMessage);
    }
  }

  private sendStreamingMessage(userMessage: string): void {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      timestamp: new Date(),
      sender: 'assistant'
    };

    this.messages.push(assistantMessage);

    this.chatService.streamChat(userMessage).subscribe({
      next: (chunk: string) => {

        if (chunk === 'Chat completed') {
          this.isLoading = false;
          this.generateFollowUpQuestions();
          return;
        }

        assistantMessage.content += chunk + ' ';
      },

      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  private sendRegularMessage(userMessage: string): void {
    this.chatService.sendMessage(this.conversationId, userMessage).subscribe({
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

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
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
