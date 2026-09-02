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
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { AdminComponent } from './admin/admin.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Auth routes
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  
  // Protected routes
  {
    path: 'knowledge-management',
    component: KnowledgeManagementComponent,
    canActivate: [authGuard],
  },
  {
    path: 'chat-hub',
    component: ChatHubComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'evaluation',
    component: EvaluationComponent,
    canActivate: [authGuard],
  },
  {
    path: 'agent-platform',
    component: AgentPlatformComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
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
  
  // Keep legacy components accessible for now (will be deprecated)
  {
    path: 'legacy/chat',
    component: ChatComponent,
    canActivate: [authGuard],
  },
  {
    path: 'legacy/documents',
    component: DocumentsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'legacy/conversations',
    component: ConversationsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'legacy/knowledge-bases',
    component: KnowledgeBasesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'legacy/collections',
    component: CollectionsComponent,
    canActivate: [authGuard],
  },
  
  { path: '**', redirectTo: '/dashboard' },
];
