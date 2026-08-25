import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, AnalyticsData } from '../core/services/analytics.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  analytics$!: Observable<AnalyticsData>;

  ngOnInit(): void {
    this.analytics$ = this.analyticsService.getAnalytics();
  }
}
