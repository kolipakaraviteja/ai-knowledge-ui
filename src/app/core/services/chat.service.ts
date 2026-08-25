import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'assistant';
  citations?: Citation[];
}

export interface Citation {
  documentName: string;
  documentId: string;
  pageNumber?: number;
  chunkIndex?: number;
  relevanceScore?: number;
  content: string;
}

export interface ChatResponse {
  answer: string;
  isFromContext: boolean;
  retrievalCount: number;
  sourceDocuments?: SourceDocument[];
}

export interface SourceDocument {
  documentName: string;
  documentId: string;
  citations: Citation[];
  chunkCount?: number;
}

export interface ConversationRequest {
  message: string;
  historyDepth?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  lastActivity?: string;
  messageCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatApiUrl = `${environment.apiUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  /**
   * Start a new conversation session
   */
  startConversation(): Observable<{ conversationId: string }> {
    return this.http.post<{ conversationId: string }>(`${this.chatApiUrl}/converse/start`, {});
  }

  /**
   * Send a message in an existing conversation with history
   */
  sendMessage(
    conversationId: string,
    message: string,
    historyDepth: number = 5
  ): Observable<ChatResponse> {
    const request: ConversationRequest = { message, historyDepth };
    return this.http.post<ChatResponse>(
      `${this.chatApiUrl}/converse?conversationId=${conversationId}`,
      request
    );
  }

  /**
   * RAG-enhanced chat with document retrieval
   */
  ragChat(query: string, topK: number = 5, knowledgeBaseId?: string, collectionId?: string): Observable<ChatResponse> {
    const params: any = { message: query, topK: topK.toString() };
    if (knowledgeBaseId) {
      params.knowledgeBaseId = knowledgeBaseId;
    }
    if (collectionId) {
      params.collectionId = collectionId;
    }
    return this.http.get<ChatResponse>(`${this.chatApiUrl}/rag`, { params });
  }

  /**
   * Simple LLM chat without document retrieval
   */
  simpleChat(query: string): Observable<string> {
    return this.http.get(`${this.chatApiUrl}?message=${encodeURIComponent(query)}`, {
      responseType: 'text',
    });
  }

  /**
   * Get all conversations
   */
  getAllConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.chatApiUrl}/conversations`);
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): Observable<void> {
    return this.http.delete<void>(`${this.chatApiUrl}/conversations/${conversationId}`);
  }

  /**
   * Search conversations
   */
  searchConversations(query: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.chatApiUrl}/conversations/search`, {
      params: { query },
    });
  }

  /**
   * Streaming chat using Server-Sent Events
   */
  streamChat(message: string): Observable<string> {
    return new Observable<string>((observer) => {
      const eventSource = new EventSource(
        `${this.chatApiUrl}/stream?message=${encodeURIComponent(message)}`
      );
      // Optional: Add timeout after 30s (client-side)
      let timeout: any;

      eventSource.addEventListener('message', (event) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          observer.error(new Error("Stream timed out"));
          eventSource.close();
        }, 30000);
      }, false);

      // Or just let server handle timeout — recommended


      // Handle normal messages
      eventSource.addEventListener('message', (event: any) => {
        if (event.data === 'Chat completed') {
          observer.next(event.data);
          eventSource.close();
          observer.complete();
        } else {
          observer.next(event.data);
        }
      });

      // Handle error from server (e.g., "Error: something went wrong")
      eventSource.addEventListener('error', (event: any) => {
        observer.error(new Error(`SSE Error: ${event.data || 'Unknown error'}`));
        eventSource.close();
      });

      // Handle network-level errors (e.g., connection lost)
      eventSource.onerror = (error: any) => {
        observer.error(new Error(`Network error: ${error.message || 'Unknown'}`));
        eventSource.close();
      };

      // Cleanup on unsubscription
      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Regenerate the last response in a conversation
   */
  regenerateResponse(conversationId: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.chatApiUrl}/conversations/${conversationId}/regenerate`,
      {}
    );
  }

  /**
   * Generate follow-up questions based on conversation context
   */
  generateFollowUpQuestions(conversationId: string): Observable<string[]> {
    return this.http.post<string[]>(
      `${this.chatApiUrl}/conversations/${conversationId}/follow-up`,
      {}
    );
  }

  /**
   * Rename a conversation
   */
  renameConversation(conversationId: string, newTitle: string): Observable<void> {
    return this.http.put<void>(
      `${this.chatApiUrl}/conversations/${conversationId}/rename`,
      { title: newTitle }
    );
  }

  /**
   * Export a conversation
   */
  exportConversation(conversationId: string, format: 'json' | 'markdown'): Observable<Blob> {
    return this.http.get(
      `${this.chatApiUrl}/conversations/${conversationId}/export`,
      { 
        params: { format },
        responseType: 'blob'
      }
    );
  }

  /**
   * Duplicate a conversation
   */
  duplicateConversation(conversationId: string): Observable<Conversation> {
    return this.http.post<Conversation>(
      `${this.chatApiUrl}/conversations/${conversationId}/duplicate`,
      {}
    );
  }

  /**
   * Archive a conversation
   */
  archiveConversation(conversationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.chatApiUrl}/conversations/${conversationId}/archive`,
      {}
    );
  }

  /**
   * Pin a conversation
   */
  pinConversation(conversationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.chatApiUrl}/conversations/${conversationId}/pin`,
      {}
    );
  }
}
