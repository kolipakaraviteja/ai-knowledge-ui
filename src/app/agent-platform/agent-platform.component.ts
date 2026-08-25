import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentPlatformService, AgentRequest, Execution, ExecutionContext, Artifact, ExecutionGraph, ExecutionNode } from '../core/services/agent-platform.service';
import { KnowledgeBasesService } from '../core/services/knowledge-bases.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-agent-platform',
  standalone: true, 
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './agent-platform.component.html',
  styleUrls: ['./agent-platform.component.css'],
})
export class AgentPlatformComponent implements OnInit {
  private agentPlatformService = inject(AgentPlatformService);
  private knowledgeBasesService = inject(KnowledgeBasesService);

  goal = '';
  context = '';
  conversationId = '';
  knowledgeBaseId = '';
  knowledgeBases: any[] = [];
  
  isLoading = false;
  errorMessage = '';
  
  execution: Execution | null = null;
  executionContext: ExecutionContext | null = null;
  
  availableTools: { [key: string]: string } = {};
  agentStatus: any = null;
  
  // Artifact viewing
  selectedArtifact: Artifact | null = null;
  showArtifactModal = false;
  artifacts: Artifact[] = [];
  artifactVersions: Artifact[] = [];
  showArtifactVersions = false;
  
  // Execution graph
  showExecutionGraph = false;
  executionGraph: ExecutionGraph | null = null;
  graphFilter: 'all' | 'milestone' | 'tool' | 'artifact' = 'all';
  selectedGraphNode: ExecutionNode | null = null;
  
  // Milestone tracking
  private readonly MILESTONES = [
    'Collect Information',
    'Analyze Information',
    'Generate Outline',
    'Write Document',
    'Review Document',
    'Complete'
  ];
  
  // Artifact filtering
  artifactFilter: 'all' | 'document' | 'outline' | 'analysis' | 'review' = 'all';
  
  // Error handling
  isCriticalError = false;
  loadingStage: 'initializing' | 'executing' | 'processing' | 'completing' = 'initializing';
  
  // Workflow visualization
  showWorkflowView = false;
  
  // Keyboard shortcuts
  showKeyboardShortcuts = false;
  
  // Dark mode
  isDarkMode = false;

  ngOnInit(): void {
    this.loadAvailableTools();
    this.loadAgentStatus();
    this.loadDarkModePreference();
    this.loadKnowledgeBases();
  }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Ctrl/Cmd + Enter: Execute agent
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!this.isLoading && this.goal.trim()) {
        this.executeAgent();
      }
    }
    
    // Ctrl/Cmd + K: Clear form
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (!this.isLoading) {
        this.clearForm();
      }
    }
    
    // Ctrl/Cmd + P: Generate plan
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      if (!this.isLoading && this.goal.trim()) {
        this.generatePlan();
      }
    }
    
    // Escape: Close modals and clear selections
    if (event.key === 'Escape') {
      this.closeArtifactModal();
      this.selectedGraphNode = null;
      this.clearError();
    }
    
    // F: Toggle workflow view
    if (event.key === 'f' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (this.execution) {
        this.toggleWorkflowView();
      }
    }
    
    // G: Toggle execution graph
    if (event.key === 'g' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (this.executionGraph) {
        this.toggleExecutionGraph();
      }
    }
  }

  loadAvailableTools(): void {
    this.agentPlatformService.getAvailableTools().subscribe({
      next: (tools) => {
        this.availableTools = tools;
      },
      error: (err) => {
        console.error('Error loading tools:', err);
        this.errorMessage = 'Failed to load available tools. Is the agent platform running?';
      }
    });
  }

  loadAgentStatus(): void {
    this.agentPlatformService.getAgentStatus().subscribe({
      next: (status) => {
        this.agentStatus = status;
      },
      error: (err) => {
        console.error('Error loading agent status:', err);
      }
    });
  }

  loadKnowledgeBases(): void {
    this.knowledgeBasesService.getKnowledgeBases().subscribe({
      next: (data) => {
        this.knowledgeBases = data;
      },
      error: (err) => {
        console.error('Error loading knowledge bases:', err);
      }
    });
  }

  executeAgent(): void {
    if (!this.goal.trim()) {
      this.errorMessage = 'Please enter a goal';
      this.isCriticalError = false;
      return;
    }

    this.isLoading = true;
    this.loadingStage = 'executing';
    this.errorMessage = '';
    this.isCriticalError = false;
    this.execution = null;
    this.artifacts = [];

    const request: AgentRequest = {
      goal: this.goal,
      context: this.context || undefined,
      conversationId: this.conversationId || undefined,
      knowledgeBaseId: this.knowledgeBaseId || undefined
    };

    this.agentPlatformService.executeAgent(request).subscribe({
      next: (response) => {
        this.loadingStage = 'completing';
        this.execution = response;
        this.artifacts = response.artifacts || [];
        this.executionGraph = response.executionGraph || null;
        this.isLoading = false;
        this.loadAgentStatus(); // Refresh status after execution
        
        // Load artifacts if execution completed successfully
        if (response.completed && response.executionId) {
          this.loadArtifacts(response.executionId);
        }
      },
      error: (error) => {
        console.error('Error executing agent:', error);
        this.isLoading = false;
        this.isCriticalError = error.status === 0;
        this.errorMessage = error.status === 0 
          ? 'Connection failed. Agent platform is not running at http://localhost:8081'
          : `Error: ${error.status} - ${error.statusText}`;
      }
    });
  }

  loadArtifacts(executionId: string): void {
    this.agentPlatformService.getArtifactsForExecution(executionId).subscribe({
      next: (artifacts) => {
        this.artifacts = artifacts;
      },
      error: (err) => {
        console.error('Error loading artifacts:', err);
      }
    });
  }

  generatePlan(): void {
    if (!this.goal.trim()) {
      this.errorMessage = 'Please enter a goal';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request: AgentRequest = {
      goal: this.goal,
      context: this.context || undefined,
      conversationId: this.conversationId || undefined,
      knowledgeBaseId: this.knowledgeBaseId || undefined
    };

    this.agentPlatformService.generatePlan(request).subscribe({
      next: (plan) => {
        console.log('Generated plan:', plan);
        this.isLoading = false;
        // For now, just log the plan. In future, display it in UI
        alert('Plan generated: ' + JSON.stringify(plan, null, 2));
      },
      error: (error) => {
        console.error('Error generating plan:', error);
        this.isLoading = false;
        this.errorMessage = `Error generating plan: ${error.statusText}`;
      }
    });
  }

  viewArtifact(artifact: Artifact): void {
    this.selectedArtifact = artifact;
    this.showArtifactModal = true;
    this.showArtifactVersions = false;
  }

  viewArtifactVersions(artifact: Artifact): void {
    this.selectedArtifact = artifact;
    this.showArtifactModal = true;
    this.showArtifactVersions = true;
    this.loadArtifactVersions(artifact.artifactId);
  }

  loadArtifactVersions(artifactId: string): void {
    this.agentPlatformService.getArtifactVersions(artifactId).subscribe({
      next: (versions) => {
        this.artifactVersions = versions;
      },
      error: (err) => {
        console.error('Error loading artifact versions:', err);
      }
    });
  }

  rollbackArtifact(artifactId: string, version: number): void {
    if (confirm(`Rollback artifact to version ${version}? This will create a new version.`)) {
      this.agentPlatformService.rollbackArtifact(artifactId, version).subscribe({
        next: (rolledBackArtifact) => {
          this.selectedArtifact = rolledBackArtifact;
          this.loadArtifactVersions(artifactId);
          alert(`Artifact rolled back to version ${version}. New version ${rolledBackArtifact.version} created.`);
        },
        error: (err) => {
          console.error('Error rolling back artifact:', err);
          alert('Failed to rollback artifact.');
        }
      });
    }
  }

  closeArtifactModal(): void {
    this.showArtifactModal = false;
    this.selectedArtifact = null;
    this.showArtifactVersions = false;
    this.artifactVersions = [];
  }

  toggleExecutionGraph(): void {
    this.showExecutionGraph = !this.showExecutionGraph;
  }
  
  toggleWorkflowView(): void {
    this.showWorkflowView = !this.showWorkflowView;
  }

  getFilteredGraphNodes(): ExecutionNode[] {
    if (!this.executionGraph) return [];
    
    if (this.graphFilter === 'all') {
      return this.executionGraph.nodes;
    }
    
    return this.executionGraph.nodes.filter(node => 
      node.nodeType.toLowerCase() === this.graphFilter
    );
  }

  getFilteredGraphEdges(): any[] {
    if (!this.executionGraph) return [];
    
    const filteredNodeIds = new Set(this.getFilteredGraphNodes().map(n => n.nodeId));
    
    return this.executionGraph.edges.filter(edge =>
      filteredNodeIds.has(edge.sourceNodeId) && filteredNodeIds.has(edge.targetNodeId)
    );
  }

  getNodeIcon(nodeType: string): string {
    switch (nodeType.toLowerCase()) {
      case 'milestone': return '🎯';
      case 'tool': return '🔧';
      case 'artifact': return '📄';
      default: return '📦';
    }
  }

  getEdgeIcon(edgeType: string): string {
    switch (edgeType.toLowerCase()) {
      case 'executes': return '▶️';
      case 'produces': return '➡️';
      case 'flows_to': return '↪️';
      default: return '→';
    }
  }
  
  // Enhanced graph methods
  selectGraphNode(node: ExecutionNode): void {
    this.selectedGraphNode = this.selectedGraphNode?.nodeId === node.nodeId ? null : node;
  }
  
  exportGraph(): void {
    if (!this.executionGraph) return;
    
    const graphData = {
      graphId: this.executionGraph.graphId,
      executionId: this.executionGraph.executionId,
      goal: this.executionGraph.goal,
      nodes: this.executionGraph.nodes,
      edges: this.executionGraph.edges,
      metadata: this.executionGraph.metadata,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-graph-${this.executionGraph.executionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadArtifact(artifact: Artifact): void {
    const blob = new Blob([artifact.content], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearForm(): void {
    this.goal = '';
    this.context = '';
    this.conversationId = '';
    this.knowledgeBaseId = '';
    this.execution = null;
    this.artifacts = [];
    this.errorMessage = '';
  }

  get hasAvailableTools(): boolean {
    return Object.keys(this.availableTools).length > 0;
  }

  get hasArtifacts(): boolean {
    return this.artifacts && this.artifacts.length > 0;
  }

  getSuccessfulActionsCount(): number {
    if (!this.execution || !this.execution.toolCalls) return 0;
    return this.execution.toolCalls.filter(call => call.success).length;
  }

  getFailedActionsCount(): number {
    if (!this.execution || !this.execution.toolCalls) return 0;
    return this.execution.toolCalls.filter(call => !call.success).length;
  }

  getArtifactIcon(type: string): string {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('document') || typeLower.includes('thesis')) {
      return '📄';
    } else if (typeLower.includes('outline')) {
      return '📋';
    } else if (typeLower.includes('summary')) {
      return '📝';
    } else if (typeLower.includes('diagram')) {
      return '📊';
    } else {
      return '📁';
    }
  }

  getStateIcon(state: string): string {
    const stateLower = state.toLowerCase();
    if (stateLower.includes('plan')) return '🧠';
    if (stateLower.includes('execute')) return '⚡';
    if (stateLower.includes('observe')) return '👁️';
    if (stateLower.includes('analyze')) return '🔍';
    if (stateLower.includes('generate')) return '✨';
    if (stateLower.includes('respond')) return '💬';
    if (stateLower.includes('finish')) return '✅';
    return '🔄';
  }
  
  // Milestone methods
  getMilestones(): string[] {
    return this.MILESTONES;
  }
  
  getMilestoneProgress(): number {
    if (!this.execution || !this.execution.completedMilestones) {
      return 0;
    }
    const completedCount = this.execution.completedMilestones.length;
    const totalMilestones = this.MILESTONES.length;
    return Math.round((completedCount / totalMilestones) * 100);
  }
  
  isCurrentMilestone(milestone: string): boolean {
    return this.execution?.currentMilestone === milestone;
  }
  
  isMilestoneCompleted(milestone: string): boolean {
    return this.execution?.completedMilestones?.includes(milestone) || false;
  }
  
  getMilestoneIcon(milestone: string): string {
    const milestoneLower = milestone.toLowerCase();
    if (milestoneLower.includes('collect')) return '🔍';
    if (milestoneLower.includes('analyze')) return '🧠';
    if (milestoneLower.includes('outline')) return '📋';
    if (milestoneLower.includes('write') || milestoneLower.includes('document')) return '📝';
    if (milestoneLower.includes('review')) return '✅';
    if (milestoneLower.includes('complete')) return '🎉';
    return '📍';
  }
  
  getMilestoneDescription(milestone: string): string {
    switch (milestone) {
      case 'Collect Information':
        return 'Gather relevant information through knowledge searches';
      case 'Analyze Information':
        return 'Synthesize collected information into analysis';
      case 'Generate Outline':
        return 'Create structured outline from analysis';
      case 'Write Document':
        return 'Generate complete document from outline';
      case 'Review Document':
        return 'Review and validate the generated document';
      case 'Complete':
        return 'Workflow completion';
      default:
        return 'Processing milestone';
    }
  }

  // State machine methods
  isStateActive(state: string): boolean {
    if (!this.execution?.plannerDecision) return false;
    return this.execution.plannerDecision.includes(state);
  }
  
  // Artifact filtering methods
  getFilteredArtifacts(): Artifact[] {
    if (this.artifactFilter === 'all') {
      return this.artifacts;
    }
    
    return this.artifacts.filter(artifact => {
      const typeLower = artifact.type.toLowerCase();
      switch (this.artifactFilter) {
        case 'document':
          return typeLower.includes('document') || typeLower.includes('thesis') || typeLower.includes('report');
        case 'outline':
          return typeLower.includes('outline') || typeLower.includes('synthesis') || typeLower.includes('insight');
        case 'analysis':
          return typeLower.includes('analysis') || typeLower.includes('analyze');
        case 'review':
          return typeLower.includes('review');
        default:
          return true;
      }
    });
  }
  
  // Error handling methods
  isConnectionError(): boolean {
    return this.errorMessage?.includes('Connection failed') || this.errorMessage?.includes('not running');
  }
  
  retryConnection(): void {
    this.loadAvailableTools();
    this.loadAgentStatus();
    this.clearError();
  }
  
  clearError(): void {
    this.errorMessage = '';
    this.isCriticalError = false;
  }
  
  // Loading state methods
  getLoadingMessage(): string {
    switch (this.loadingStage) {
      case 'initializing':
        return 'Initializing agent...';
      case 'executing':
        return 'Agent is working on your goal...';
      case 'processing':
        return 'Processing results...';
      case 'completing':
        return 'Finalizing execution...';
      default:
        return 'Processing...';
    }
  }
  
  getLoadingSubtext(): string {
    switch (this.loadingStage) {
      case 'executing':
        return 'This may take a moment depending on the complexity of your request';
      case 'processing':
        return 'Analyzing and synthesizing information';
      case 'completing':
        return 'Almost done...';
      default:
        return 'Please wait';
    }
  }
  
  // Dark mode methods
  loadDarkModePreference(): void {
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      this.isDarkMode = savedPreference === 'true';
      this.applyDarkMode();
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = prefersDark;
      this.applyDarkMode();
    }
  }
  
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.applyDarkMode();
  }
  
  applyDarkMode(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
