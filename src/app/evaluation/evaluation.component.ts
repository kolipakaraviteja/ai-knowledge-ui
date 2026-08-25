import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationService, EvaluationTest, EvaluationRun, EvaluationResult, CreateTestRequest, CreateRunRequest, CreateEnhancedTestRequest } from '../core/services/evaluation.service';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.css']
})
export class EvaluationComponent implements OnInit {
  tests: EvaluationTest[] = [];
  runs: EvaluationRun[] = [];
  results: EvaluationResult[] = [];
  isLoading = false;
  error: string | null = null;
  
  // View state
  activeTab: 'tests' | 'runs' | 'results' = 'tests';
  selectedRunId: string | null = null;
  
  // Form state
  showCreateTestForm = false;
  showCreateRunForm = false;
  showEnhancedTestForm = false;
  showGenerateTestsForm = false;
  showLoadManualTestsForm = false;
  
  testFormData = {
    name: '',
    query: '',
    expectedChunkIds: ''
  };
  
  enhancedTestFormData = {
    name: '',
    query: '',
    expectedChunkIds: '',
    category: '',
    language: '',
    difficulty: '',
    documentScope: '',
    expectedAnswer: '',
    keyPoints: ''
  };
  
  runFormData = {
    name: '',
    description: ''
  };

  generateTestsFormData = {
    sampleSize: 10
  };

  loadManualTestsFormData = {
    filePath: 'manual-evaluation-tests.json'
  };

  // Filtering
  selectedCategory: string = '';
  selectedLanguage: string = '';
  testCount: number = 0;

  constructor(private evaluationService: EvaluationService) {}

  ngOnInit(): void {
    this.loadTests();
    this.loadRuns();
    this.loadTestCount();
  }

  loadTests(): void {
    this.isLoading = true;
    this.evaluationService.getTests()
      .subscribe({
        next: (data) => {
          this.tests = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load evaluation tests';
          this.isLoading = false;
          console.error('Error loading tests:', err);
        }
      });
  }

  loadTestCount(): void {
    this.evaluationService.getTestCount()
      .subscribe({
        next: (count) => {
          this.testCount = count;
        },
        error: (err) => {
          console.error('Error loading test count:', err);
        }
      });
  }

  loadRuns(): void {
    this.evaluationService.getRuns()
      .subscribe({
        next: (data) => {
          this.runs = data;
        },
        error: (err) => {
          console.error('Error loading runs:', err);
        }
      });
  }

  loadResults(runId: string): void {
    this.selectedRunId = runId;
    this.isLoading = true;
    this.evaluationService.getRunResults(runId)
      .subscribe({
        next: (data) => {
          this.results = data;
          this.isLoading = false;
          this.activeTab = 'results';
        },
        error: (err) => {
          this.error = 'Failed to load evaluation results';
          this.isLoading = false;
          console.error('Error loading results:', err);
        }
      });
  }

  openCreateTestForm(): void {
    this.showCreateTestForm = true;
    this.testFormData = { name: '', query: '', expectedChunkIds: '' };
  }

  closeTestForm(): void {
    this.showCreateTestForm = false;
    this.testFormData = { name: '', query: '', expectedChunkIds: '' };
  }

  openEnhancedTestForm(): void {
    this.showEnhancedTestForm = true;
    this.enhancedTestFormData = {
      name: '',
      query: '',
      expectedChunkIds: '',
      category: '',
      language: '',
      difficulty: '',
      documentScope: '',
      expectedAnswer: '',
      keyPoints: ''
    };
  }

  closeEnhancedTestForm(): void {
    this.showEnhancedTestForm = false;
    this.enhancedTestFormData = {
      name: '',
      query: '',
      expectedChunkIds: '',
      category: '',
      language: '',
      difficulty: '',
      documentScope: '',
      expectedAnswer: '',
      keyPoints: ''
    };
  }

  createEnhancedTest(): void {
    if (!this.enhancedTestFormData.name.trim() || !this.enhancedTestFormData.query.trim()) return;
    
    this.isLoading = true;
    const chunkIds = this.enhancedTestFormData.expectedChunkIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    const keyPoints = this.enhancedTestFormData.keyPoints
      .split('\n')
      .map(point => point.trim())
      .filter(point => point.length > 0);
    
    const request: CreateEnhancedTestRequest = {
      name: this.enhancedTestFormData.name,
      query: this.enhancedTestFormData.query,
      expectedChunkIds: chunkIds,
      category: this.enhancedTestFormData.category || undefined,
      language: this.enhancedTestFormData.language || undefined,
      difficulty: this.enhancedTestFormData.difficulty || undefined,
      documentScope: this.enhancedTestFormData.documentScope || undefined,
      expectedAnswer: this.enhancedTestFormData.expectedAnswer || undefined,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined
    };
    
    this.evaluationService.createEnhancedTest(request)
      .subscribe({
        next: () => {
          this.loadTests();
          this.loadTestCount();
          this.closeEnhancedTestForm();
        },
        error: (err) => {
          this.error = 'Failed to create enhanced test';
          this.isLoading = false;
          console.error('Error creating enhanced test:', err);
        }
      });
  }

  createTest(): void {
    if (!this.testFormData.name.trim() || !this.testFormData.query.trim()) return;
    
    this.isLoading = true;
    const chunkIds = this.testFormData.expectedChunkIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    const request: CreateTestRequest = {
      name: this.testFormData.name,
      query: this.testFormData.query,
      expectedChunkIds: chunkIds
    };
    
    this.evaluationService.createTest(request)
      .subscribe({
        next: () => {
          this.loadTests();
          this.closeTestForm();
        },
        error: (err) => {
          this.error = 'Failed to create test';
          this.isLoading = false;
          console.error('Error creating test:', err);
        }
      });
  }

  deleteTest(id: string): void {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    this.isLoading = true;
    this.evaluationService.deleteTest(id)
      .subscribe({
        next: () => {
          this.loadTests();
        },
        error: (err) => {
          this.error = 'Failed to delete test';
          this.isLoading = false;
          console.error('Error deleting test:', err);
        }
      });
  }

  openCreateRunForm(): void {
    this.showCreateRunForm = true;
    this.runFormData = { name: '', description: '' };
  }

  closeRunForm(): void {
    this.showCreateRunForm = false;
    this.runFormData = { name: '', description: '' };
  }

  createRun(): void {
    if (!this.runFormData.name.trim()) return;
    
    this.isLoading = true;
    const request: CreateRunRequest = {
      name: this.runFormData.name,
      description: this.runFormData.description
    };
    
    this.evaluationService.createRun(request)
      .subscribe({
        next: (run) => {
          this.loadRuns();
          this.closeRunForm();
          this.runEvaluation(run.id);
        },
        error: (err) => {
          this.error = 'Failed to create run';
          this.isLoading = false;
          console.error('Error creating run:', err);
        }
      });
  }

  runEvaluation(runId: string): void {
    this.isLoading = true;
    this.evaluationService.executeRun(runId)
      .subscribe({
        next: () => {
          this.loadRuns();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to run evaluation';
          this.isLoading = false;
          console.error('Error running evaluation:', err);
        }
      });
  }

  deleteRun(id: string): void {
    if (!confirm('Are you sure you want to delete this run and all its results?')) return;
    
    this.isLoading = true;
    this.evaluationService.deleteRun(id)
      .subscribe({
        next: () => {
          this.loadRuns();
          if (this.selectedRunId === id) {
            this.selectedRunId = null;
            this.results = [];
            this.activeTab = 'runs';
          }
        },
        error: (err) => {
          this.error = 'Failed to delete run';
          this.isLoading = false;
          console.error('Error deleting run:', err);
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-success';
      case 'RUNNING': return 'bg-primary';
      case 'FAILED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  calculateAverageMetric(metricName: string): number {
    if (this.results.length === 0) return 0;
    const values = this.results
      .map(r => (r.metrics as any)[metricName] as number)
      .filter(v => v !== undefined && !isNaN(v));
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getRecallAtK(result: EvaluationResult): string {
    const value = (result.metrics as any).recallAtK;
    if (value === undefined || value === null || isNaN(value)) return '-';
    return (value * 100).toFixed(1);
  }

  getPrecisionAtK(result: EvaluationResult): string {
    const value = (result.metrics as any).precisionAtK;
    if (value === undefined || value === null || isNaN(value)) return '-';
    return (value * 100).toFixed(1);
  }

  getMRR(result: EvaluationResult): string {
    const value = (result.metrics as any).mrr;
    if (value === undefined || value === null || isNaN(value)) return '-';
    return value.toFixed(3);
  }

  exportResults(): void {
    if (!this.selectedRunId) return;
    
    this.evaluationService.exportResults(this.selectedRunId )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `evaluation-results-${this.selectedRunId}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.error = 'Failed to export results';
          console.error('Error exporting results:', err);
        }
      });
  }

  // New methods for enhanced features
  openGenerateTestsForm(): void {
    this.showGenerateTestsForm = true;
    this.generateTestsFormData = { sampleSize: 10 };
  }

  closeGenerateTestsForm(): void {
    this.showGenerateTestsForm = false;
  }

  generateTests(): void {
    this.isLoading = true;
    this.evaluationService.generateTests(this.generateTestsFormData.sampleSize)
      .subscribe({
        next: (tests) => {
          this.loadTests();
          this.loadTestCount();
          this.closeGenerateTestsForm();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to generate tests';
          this.isLoading = false;
          console.error('Error generating tests:', err);
        }
      });
  }

  openLoadManualTestsForm(): void {
    this.showLoadManualTestsForm = true;
    this.loadManualTestsFormData = { filePath: 'manual-evaluation-tests.json' };
  }

  closeLoadManualTestsForm(): void {
    this.showLoadManualTestsForm = false;
  }

  loadManualTests(): void {
    this.isLoading = true;
    this.evaluationService.loadManualTests(this.loadManualTestsFormData.filePath)
      .subscribe({
        next: (tests) => {
          this.loadTests();
          this.loadTestCount();
          this.closeLoadManualTestsForm();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load manual tests';
          this.isLoading = false;
          console.error('Error loading manual tests:', err);
        }
      });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.selectedLanguage = '';
    if (category) {
      this.evaluationService.getTestsByCategory(category)
        .subscribe({
          next: (data) => {
            this.tests = data;
          },
          error: (err) => {
            this.error = 'Failed to filter tests by category';
            console.error('Error filtering by category:', err);
          }
        });
    } else {
      this.loadTests();
    }
  }

  filterByLanguage(language: string): void {
    this.selectedLanguage = language;
    this.selectedCategory = '';
    if (language) {
      this.evaluationService.getTestsByLanguage(language)
        .subscribe({
          next: (data) => {
            this.tests = data;
          },
          error: (err) => {
            this.error = 'Failed to filter tests by language';
            console.error('Error filtering by language:', err);
          }
        });
    } else {
      this.loadTests();
    }
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.selectedLanguage = '';
    this.loadTests();
  }

  runSingleTest(testId: string): void {
    this.isLoading = true;
    this.evaluationService.runSingleTest(testId)
      .subscribe({
        next: (metrics) => {
          this.isLoading = false;
          alert('Test executed successfully. Check console for metrics.');
          console.log('Test metrics:', metrics);
        },
        error: (err) => {
          this.error = 'Failed to run single test';
          this.isLoading = false;
          console.error('Error running single test:', err);
        }
      });
  }

  // Enhanced metrics display methods
  getEnhancedMetric(result: EvaluationResult, metricName: string): string {
    const value = (result.metrics as any)[metricName];
    if (value === undefined || value === null || isNaN(value)) return '-';
    if (metricName.includes('recall') || metricName.includes('precision') || 
        metricName.includes('faithfulness') || metricName.includes('relevance') ||
        metricName.includes('completeness') || metricName.includes('citation') ||
        metricName.includes('coverage') || metricName.includes('hit_rate') ||
        metricName.includes('ndcg') || metricName.includes('map') || metricName.includes('quality')) {
      return (value * 100).toFixed(1) + '%';
    }
    return value.toFixed(3);
  }

  getTestCategory(test: EvaluationTest): string {
    return test.category || '-';
  }

  getTestLanguage(test: EvaluationTest): string {
    return test.language || '-';
  }

  getTestDifficulty(test: EvaluationTest): string {
    return test.difficulty || '-';
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'EASY': return 'bg-success';
      case 'MEDIUM': return 'bg-warning';
      case 'HARD': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'FACTUAL': return 'bg-primary';
      case 'CONCEPTUAL': return 'bg-info';
      case 'COMPARATIVE': return 'bg-warning';
      case 'NUMERICAL': return 'bg-success';
      case 'MULTI_HOP': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
