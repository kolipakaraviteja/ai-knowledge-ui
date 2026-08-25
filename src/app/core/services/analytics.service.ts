import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  documentsSummary: DocumentStatistics[];
  conversationMetrics: ConversationMetrics;
}

export interface DocumentStatistics {
  name: string;
  processedAt: Date;
  status: string;
}

export interface ConversationMetrics {
  averageMessageCount: number;
  totalActiveConversations: number;
  lastActivityDate: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(this.apiUrl);
  }

  getDetailedStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/detailed`);
  }
}
