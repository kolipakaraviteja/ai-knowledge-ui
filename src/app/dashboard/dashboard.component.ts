import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { DashboardService, DashboardStats, AnalyticsData } from '../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalConversations: 0,
    totalDocuments: 0,
    totalChunks: 0,
    totalKnowledgeBases: 0,
    totalCollections: 0,
    queriesToday: 0,
    averageResponseTime: 0,
    recentActivity: []
  };
  analytics: AnalyticsData = {
    queriesToday: 0,
    averageResponseTime: 0,
    queriesOverTime: [],
    responseTimeTrends: []
  };
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['title', 'created', 'lastActivity', 'messages'];

  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadAnalytics();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard statistics:', err);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }


  loadAnalytics(): void {
    this.dashboardService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.analytics = {
          queriesToday: 0,
          averageResponseTime: 0,
          queriesOverTime: [],
          responseTimeTrends: []
        };
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatResponseTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }
}
