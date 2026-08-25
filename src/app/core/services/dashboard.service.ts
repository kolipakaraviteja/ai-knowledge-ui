
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatService, Conversation } from './chat.service';
import { DocumentService, DocumentUploadResponse } from './document.service';
import { KnowledgeBasesService, KnowledgeBase } from './knowledge-bases.service';
import { CollectionsService, Collection } from './collections.service';

export interface DashboardStats {
  totalConversations: number;
  totalDocuments: number;
  totalChunks: number;
  totalKnowledgeBases: number;
  totalCollections: number;
  queriesToday: number;
  averageResponseTime: number;
  recentActivity: Conversation[];
}

export interface AnalyticsData {
  queriesToday: number;
  averageResponseTime: number;
  queriesOverTime: { date: string; count: number }[];
  responseTimeTrends: { date: string; avgTime: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private http: HttpClient,
    private chatService: ChatService,
    private documentService: DocumentService,
    private knowledgeBasesService: KnowledgeBasesService,
    private collectionsService: CollectionsService
  ) {}

  /**
   * Get all dashboard statistics aggregated from multiple services
   */
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      conversations: this.chatService.getAllConversations(),
      documents: this.documentService.getDocuments(),
      knowledgeBases: this.knowledgeBasesService.getKnowledgeBases(),
      collections: this.collectionsService.getCollections()
    }).pipe(
      map(({ conversations, documents, knowledgeBases, collections }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const conversationsToday = conversations.filter(conv => {
          const convDate = new Date(conv.createdAt);
          convDate.setHours(0, 0, 0, 0);
          return convDate.getTime() === today.getTime();
        });

        const avgMessageCount = conversations.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.messageCount || 0), 0) / conversations.length
          : 0;

        return {
          totalConversations: conversations.length,
          totalDocuments: documents.length,
          totalChunks: documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0),
          totalKnowledgeBases: knowledgeBases.length,
          totalCollections: collections.length,
          queriesToday: conversationsToday.length,
          averageResponseTime: Math.round(avgMessageCount * 100),
          recentActivity: conversations.slice(0, 5)
        };
      }),
      catchError((err) => {
        console.error('Error fetching dashboard stats:', err);
        return throwError(() => new Error('Failed to load dashboard statistics'));
      })
    );
  }

  /**
   * Get analytics data calculated from conversation data
   */
  getAnalytics(): Observable<AnalyticsData> {
    return this.chatService.getAllConversations().pipe(
      map((conversations) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const conversationsToday = conversations.filter(conv => {
          const convDate = new Date(conv.createdAt);
          convDate.setHours(0, 0, 0, 0);
          return convDate.getTime() === today.getTime();
        });

        const avgMessageCount = conversations.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.messageCount || 0), 0) / conversations.length
          : 0;

        const queriesByDate: { [key: string]: number } = {};
        conversations.forEach(conv => {
          const date = new Date(conv.createdAt).toLocaleDateString();
          queriesByDate[date] = (queriesByDate[date] || 0) + 1;
        });

        const queriesOverTime = Object.entries(queriesByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const trendsByDate: { [key: string]: { total: number; count: number } } = {};
        conversations.forEach(conv => {
          const date = new Date(conv.createdAt).toLocaleDateString();
          if (!trendsByDate[date]) {
            trendsByDate[date] = { total: 0, count: 0 };
          }
          trendsByDate[date].total += conv.messageCount || 0;
          trendsByDate[date].count += 1;
        });

        const responseTimeTrends = Object.entries(trendsByDate)
          .map(([date, data]) => ({
            date,
            avgTime: Math.round((data.total / data.count) * 100)
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          queriesToday: conversationsToday.length,
          averageResponseTime: Math.round(avgMessageCount * 100),
          queriesOverTime,
          responseTimeTrends
        };
      }),
      catchError((err) => {
        console.error('Error fetching analytics:', err);
        return throwError(() => new Error('Failed to load analytics'));
      })
    );
  }
}