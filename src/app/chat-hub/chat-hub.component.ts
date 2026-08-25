import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatInterfaceComponent } from './chat-interface/chat-interface.component';
import { ConversationsListComponent } from './conversations-list/conversations-list.component';

@Component({
  selector: 'app-chat-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    ChatInterfaceComponent,
    ConversationsListComponent
  ],
  templateUrl: './chat-hub.component.html',
  styleUrls: ['./chat-hub.component.css']
})
export class ChatHubComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  selectedTab = 0;

  constructor() {
    // Set initial tab based on query parameter
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'conversations') {
        this.selectedTab = 1;
      }
    });
  }

  onTabChange(index: number): void {
    // Update query parameter when tab changes
    const tabNames = ['chat', 'conversations'];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabNames[index] },
      queryParamsHandling: 'merge'
    });
  }
}
