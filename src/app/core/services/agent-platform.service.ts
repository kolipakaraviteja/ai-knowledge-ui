import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgentRequest {
  goal: string;
  context?: string;
  conversationId?: string;
  knowledgeBaseId?: string;
}

export interface Execution {
  executionId: string;
  goal: string;
  answer: string;
  completed: boolean;
  status: string;
  errorMessage?: string;
  plannerReasoning?: string;
  plannerDecision?: string;
  plannerNextStep?: string;
  plannerConfidence?: number;
  actionsTaken?: Action[];
  toolCalls?: ToolCall[];
  observations?: Observation[];
  artifacts?: Artifact[];
  executionGraph?: ExecutionGraph;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  currentMilestone?: string;
  completedMilestones?: string[];
  correlationId?: string;
}

export interface Artifact {
  artifactId: string;
  version?: number;
  parentArtifactId?: string;
  type: string;
  name: string;
  content: string;
  mimeType: string;
  createdBy: string;
  relatedExecutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionGraph {
  graphId: string;
  executionId: string;
  goal: string;
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
  metadata: GraphMetadata;
}

export interface ExecutionNode {
  nodeId: string;
  nodeType: 'MILESTONE' | 'TOOL' | 'ARTIFACT';
  name: string;
  data: { [key: string]: any };
  executionId: string;
  order: number;
}

export interface ExecutionEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: 'EXECUTES' | 'PRODUCES' | 'FLOWS_TO';
  data?: string;
  executionId: string;
  order: number;
}

export interface GraphMetadata {
  startTime: string;
  endTime: string;
  durationMs: number;
  totalNodes: number;
  totalEdges: number;
  status: string;
}

export interface ToolCall {
  callId: string;
  actionId: string;
  toolName: string;
  parameters?: { [key: string]: any };
  result: string;
  success: boolean;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface Action {
  actionId: string;
  toolName: string;
  description: string;
  parameters?: { [key: string]: any };
  status: string;
  durationMs?: number;
}

export interface Observation {
  observationId: string;
  toolName: string;
  content: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface ExecutionContext {
  executionId: string;
  goal: string;
  plan?: any;
  currentStep: number;
  observations: Observation[];
  toolResults: any[];
  variables: { [key: string]: any };
  knowledgeReferences: string[];
  retryHistory: any[];
  metadata: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentPlatformService {
  private agentPlatformApiUrl = `${environment.agentPlatformUrl}/api/agent`;

  constructor(private http: HttpClient) {}

  /**
   * Execute agent request
   */
  executeAgent(request: AgentRequest): Observable<Execution> {
    return this.http.post<Execution>(`${this.agentPlatformApiUrl}/execute`, request);
  }

  /**
   * Generate plan without execution
   */
  generatePlan(request: AgentRequest): Observable<any> {
    return this.http.post(`${this.agentPlatformApiUrl}/plan`, request);
  }

  /**
   * Execute single tool
   */
  executeTool(toolRequest: any): Observable<any> {
    return this.http.post(`${this.agentPlatformApiUrl}/tool`, toolRequest);
  }

  /**
   * Get agent status
   */
  getAgentStatus(): Observable<any> {
    return this.http.get(`${this.agentPlatformApiUrl}/status`);
  }

  /**
   * Get available tools
   */
  getAvailableTools(): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(`${this.agentPlatformApiUrl}/tools`);
  }

  /**
   * Get artifacts for a specific execution
   */
  getArtifactsForExecution(executionId: string): Observable<Artifact[]> {
    return this.http.get<Artifact[]>(`${this.agentPlatformApiUrl}/artifacts/${executionId}`);
  }

  /**
   * Get a specific artifact by ID
   */
  getArtifact(artifactId: string): Observable<Artifact> {
    return this.http.get<Artifact>(`${this.agentPlatformApiUrl}/artifact/${artifactId}`);
  }

  /**
   * Get artifact versions
   */
  getArtifactVersions(artifactId: string): Observable<Artifact[]> {
    return this.http.get<Artifact[]>(`${this.agentPlatformApiUrl}/artifact/${artifactId}/versions`);
  }

  /**
   * Rollback artifact to specific version
   */
  rollbackArtifact(artifactId: string, version: number): Observable<Artifact> {
    return this.http.post<Artifact>(`${this.agentPlatformApiUrl}/artifact/${artifactId}/rollback/${version}`, {});
  }
}
