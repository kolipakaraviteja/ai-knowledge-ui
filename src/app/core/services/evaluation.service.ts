
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EvaluationTest {
  id: string;
  name: string;
  query: string;
  expectedChunkIds: string[];
  createdAt: string;
  category?: string;
  language?: string;
  difficulty?: string;
  documentScope?: string;
  expectedAnswer?: string;
  keyPoints?: string[];
  expectedDocuments?: string[];
}

export interface CreateTestRequest {
  name: string;
  query: string;
  expectedChunkIds: string[];
}

export interface CreateEnhancedTestRequest {
  name: string;
  query: string;
  expectedChunkIds: string[];
  category?: string;
  language?: string;
  difficulty?: string;
  documentScope?: string;
  expectedAnswer?: string;
  keyPoints?: string[];
}

export interface EvaluationRun {
  id: string;
  name: string;
  description: string;
  startedAt: string;
  completedAt: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface CreateRunRequest {
  name: string;
  description: string;
}

export interface EvaluationResult {
  id: string;
  testId: string;
  runId: string;
  query?: string;
  expectedAnswer?: string;
  retrievedChunkIds: string[];
  metrics: {
    recallAtK?: number;
    precisionAtK?: number;
    mrr?: number;
    latency?: number;
    recall_at_1?: number;
    recall_at_5?: number;
    recall_at_10?: number;
    precision_at_1?: number;
    precision_at_5?: number;
    precision_at_10?: number;
    ndcg_at_5?: number;
    ndcg_at_10?: number;
    map?: number;
    hit_rate_at_5?: number;
    hit_rate_at_10?: number;
    coverage?: number;
    faithfulness?: number;
    relevance?: number;
    completeness?: number;
    citation_accuracy?: number;
    overall_quality?: number;
    test_category?: string;
    test_language?: string;
    test_difficulty?: string;
    test_document_scope?: string;
    generated_answer?: string;
  };
  latencyMs: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private apiUrl = `${environment.apiUrl}/api/evaluation`;

  constructor(private http: HttpClient) {}

  /**
   * Get all evaluation tests
   */
  getTests(): Observable<EvaluationTest[]> {
    return this.http.get<EvaluationTest[]>(`${this.apiUrl}/tests`).pipe(
      catchError((err) => {
        console.error('Error fetching evaluation tests:', err);
        return throwError(() => new Error('Failed to load evaluation tests'));
      })
    );
  }

  /**
   * Create a new evaluation test
   */
  createTest(request: CreateTestRequest): Observable<EvaluationTest> {
    return this.http.post<EvaluationTest>(`${this.apiUrl}/tests`, request).pipe(
      catchError((err) => {
        console.error('Error creating evaluation test:', err);
        return throwError(() => new Error('Failed to create test'));
      })
    );
  }

  /**
   * Create an enhanced evaluation test with categorization
   */
  createEnhancedTest(request: CreateEnhancedTestRequest): Observable<EvaluationTest> {
    return this.http.post<EvaluationTest>(`${this.apiUrl}/tests/enhanced`, request).pipe(
      catchError((err) => {
        console.error('Error creating enhanced evaluation test:', err);
        return throwError(() => new Error('Failed to create enhanced test'));
      })
    );
  }

  /**
   * Get tests by category
   */
  getTestsByCategory(category: string): Observable<EvaluationTest[]> {
    return this.http.get<EvaluationTest[]>(`${this.apiUrl}/tests/category/${category}`).pipe(
      catchError((err) => {
        console.error('Error fetching tests by category:', err);
        return throwError(() => new Error('Failed to load tests by category'));
      })
    );
  }

  /**
   * Get tests by language
   */
  getTestsByLanguage(language: string): Observable<EvaluationTest[]> {
    return this.http.get<EvaluationTest[]>(`${this.apiUrl}/tests/language/${language}`).pipe(
      catchError((err) => {
        console.error('Error fetching tests by language:', err);
        return throwError(() => new Error('Failed to load tests by language'));
      })
    );
  }

  /**
   * Generate tests using LLM
   */
  generateTests(sampleSize: number = 10): Observable<EvaluationTest[]> {
    return this.http.post<EvaluationTest[]>(`${this.apiUrl}/tests/generate`, null, {
      params: { sampleSize: sampleSize.toString() }
    }).pipe(
      catchError((err) => {
        console.error('Error generating tests:', err);
        return throwError(() => new Error('Failed to generate tests'));
      })
    );
  }

  /**
   * Load manual tests from JSON file
   */
  loadManualTests(filePath: string = 'manual-evaluation-tests.json'): Observable<EvaluationTest[]> {
    return this.http.post<EvaluationTest[]>(`${this.apiUrl}/tests/load-manual`, null, {
      params: { filePath: filePath }
    }).pipe(
      catchError((err) => {
        console.error('Error loading manual tests:', err);
        return throwError(() => new Error('Failed to load manual tests'));
      })
    );
  }

  /**
   * Get test count
   */
  getTestCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/tests/count`).pipe(
      catchError((err) => {
        console.error('Error fetching test count:', err);
        return throwError(() => new Error('Failed to load test count'));
      })
    );
  }

  /**
   * Run a single test
   */
  runSingleTest(testId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tests/${testId}/run`, {}).pipe(
      catchError((err) => {
        console.error('Error running single test:', err);
        return throwError(() => new Error('Failed to run test'));
      })
    );
  }

  /**
   * Delete an evaluation test
   */
  deleteTest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tests/${id}`).pipe(
      catchError((err) => {
        console.error('Error deleting evaluation test:', err);
        return throwError(() => new Error('Failed to delete test'));
      })
    );
  }

  /**
   * Get all evaluation runs
   */
  getRuns(): Observable<EvaluationRun[]> {
    return this.http.get<EvaluationRun[]>(`${this.apiUrl}/runs`).pipe(
      catchError((err) => {
        console.error('Error fetching evaluation runs:', err);
        return throwError(() => new Error('Failed to load evaluation runs'));
      })
    );
  }

  /**
   * Create a new evaluation run
   */
  createRun(request: CreateRunRequest): Observable<EvaluationRun> {
    return this.http.post<EvaluationRun>(`${this.apiUrl}/runs`, request).pipe(
      catchError((err) => {
        console.error('Error creating evaluation run:', err);
        return throwError(() => new Error('Failed to create run'));
      })
    );
  }

  /**
   * Execute an evaluation run
   */
  executeRun(runId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/runs/${runId}/execute`, {}).pipe(
      catchError((err) => {
        console.error('Error executing evaluation run:', err);
        return throwError(() => new Error('Failed to run evaluation'));
      })
    );
  }

  /**
   * Delete an evaluation run
   */
  deleteRun(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/runs/${id}`).pipe(
      catchError((err) => {
        console.error('Error deleting evaluation run:', err);
        return throwError(() => new Error('Failed to delete run'));
      })
    );
  }

  /**
   * Get results for a specific evaluation run
   */
  getRunResults(runId: string): Observable<EvaluationResult[]> {
    return this.http.get<EvaluationResult[]>(`${this.apiUrl}/runs/${runId}/results`).pipe(
      catchError((err) => {
        console.error('Error fetching evaluation results:', err);
        return throwError(() => new Error('Failed to load evaluation results'));
      })
    );
  }

  /**
   * Export evaluation results as a file
   */
  exportResults(runId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/runs/${runId}/export`, { responseType: 'blob' }).pipe(
      catchError((err) => {
        console.error('Error exporting evaluation results:', err);
        return throwError(() => new Error('Failed to export results'));
      })
    );
  }
}
