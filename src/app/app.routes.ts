import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { DocumentsComponent } from './documents/documents.component';
import { ConversationsComponent } from './conversations/conversations.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { KnowledgeBasesComponent } from './knowledge-bases/knowledge-bases.component';
import { CollectionsComponent } from './collections/collections.component';
import { EvaluationComponent } from './evaluation/evaluation.component';
import { AgentPlatformComponent } from './agent-platform/agent-platform.component';
import { KnowledgeManagementComponent } from './knowledge-management/knowledge-management.component';
import { ChatHubComponent } from './chat-hub/chat-hub.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // New parent component routes
  {
    path: 'knowledge-management',
    component: KnowledgeManagementComponent,
  },
  {
    path: 'chat-hub',
    component: ChatHubComponent,
  },
  
  // Legacy routes with redirects for backward compatibility
  {
    path: 'chat',
    redirectTo: '/chat-hub',
    pathMatch: 'full',
  },
  {
    path: 'documents',
    redirectTo: '/knowledge-management?tab=documents',
    pathMatch: 'full',
  },
  {
    path: 'conversations',
    redirectTo: '/chat-hub?tab=conversations',
    pathMatch: 'full',
  },
  {
    path: 'knowledge-bases',
    redirectTo: '/knowledge-management?tab=knowledge-bases',
    pathMatch: 'full',
  },
  {
    path: 'collections',
    redirectTo: '/knowledge-management?tab=collections',
    pathMatch: 'full',
  },
  
  // Other existing routes
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'evaluation',
    component: EvaluationComponent,
  },
  {
    path: 'agent-platform',
    component: AgentPlatformComponent,
  },
  
  // Keep legacy components accessible for now (will be deprecated)
  {
    path: 'legacy/chat',
    component: ChatComponent,
  },
  {
    path: 'legacy/documents',
    component: DocumentsComponent,
  },
  {
    path: 'legacy/conversations',
    component: ConversationsComponent,
  },
  {
    path: 'legacy/knowledge-bases',
    component: KnowledgeBasesComponent,
  },
  {
    path: 'legacy/collections',
    component: CollectionsComponent,
  },
  
  { path: '**', redirectTo: '/dashboard' },
];
