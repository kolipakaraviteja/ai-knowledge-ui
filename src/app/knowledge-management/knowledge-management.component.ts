import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router, ActivatedRoute } from '@angular/router';
import { KnowledgeBasesListComponent } from './knowledge-bases-list/knowledge-bases-list.component';
import { CollectionsListComponent } from './collections-list/collections-list.component';
import { DocumentsListComponent } from './documents-list/documents-list.component';

@Component({
  selector: 'app-knowledge-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    KnowledgeBasesListComponent,
    CollectionsListComponent,
    DocumentsListComponent
  ],
  templateUrl: './knowledge-management.component.html',
  styleUrls: ['./knowledge-management.component.css']
})
export class KnowledgeManagementComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  selectedTab = 0;

  constructor() {
    // Set initial tab based on query parameter
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'collections') {
        this.selectedTab = 1;
      } else if (tab === 'documents') {
        this.selectedTab = 2;
      }
    });
  }

  onTabChange(index: number): void {
    // Update query parameter when tab changes
    const tabNames = ['knowledge-bases', 'collections', 'documents'];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabNames[index] },
      queryParamsHandling: 'merge'
    });
  }
}
