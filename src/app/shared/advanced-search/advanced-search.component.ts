import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface SearchFilter {
  type: string;
  value: string;
  label: string;
}

interface SearchHistoryItem {
  query: string;
  timestamp: Date;
}

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatCheckboxModule
  ],
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.css']
})
export class AdvancedSearchComponent {
  @Output() search = new EventEmitter<AdvancedSearchParams>();

  searchQuery = '';
  showAdvancedFilters = false;
  
  // Filters
  selectedFileTypes: string[] = [];
  selectedDateRange: { start: Date | null; end: Date | null } = { start: null, end: null };
  minFileSize: number | null = null;
  maxFileSize: number | null = null;
  selectedKnowledgeBases: string[] = [];
  
  // Options
  fileTypes = ['PDF', 'TXT', 'DOCX'];
  knowledgeBases = ['Knowledge Base 1', 'Knowledge Base 2', 'Knowledge Base 3'];
  
  // Search history
  searchHistory: SearchHistoryItem[] = [];
  showSuggestions = false;
  suggestions: string[] = [];

  constructor() {
    this.loadSearchHistory();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.addToSearchHistory(this.searchQuery);
      this.search.emit({
        query: this.searchQuery,
        fileTypes: this.selectedFileTypes,
        dateRange: this.selectedDateRange,
        fileSizeRange: { min: this.minFileSize, max: this.maxFileSize },
        knowledgeBases: this.selectedKnowledgeBases
      });
    }
  }

  onClear(): void {
    this.searchQuery = '';
    this.selectedFileTypes = [];
    this.selectedDateRange = { start: null, end: null };
    this.minFileSize = null;
    this.maxFileSize = null;
    this.selectedKnowledgeBases = [];
  }

  onFileTypeToggle(fileType: string): void {
    const index = this.selectedFileTypes.indexOf(fileType);
    if (index === -1) {
      this.selectedFileTypes.push(fileType);
    } else {
      this.selectedFileTypes.splice(index, 1);
    }
  }

  removeFilter(filter: SearchFilter): void {
    switch (filter.type) {
      case 'fileType':
        this.selectedFileTypes = this.selectedFileTypes.filter(ft => ft !== filter.value);
        break;
      case 'knowledgeBase':
        this.selectedKnowledgeBases = this.selectedKnowledgeBases.filter(kb => kb !== filter.value);
        break;
    }
  }

  get activeFilters(): SearchFilter[] {
    const filters: SearchFilter[] = [];
    
    this.selectedFileTypes.forEach(ft => {
      filters.push({ type: 'fileType', value: ft, label: ft });
    });
    
    this.selectedKnowledgeBases.forEach(kb => {
      filters.push({ type: 'knowledgeBase', value: kb, label: kb });
    });
    
    if (this.selectedDateRange.start) {
      filters.push({ type: 'dateRange', value: 'date', label: `From ${this.formatDate(this.selectedDateRange.start)}` });
    }
    
    if (this.minFileSize) {
      filters.push({ type: 'minSize', value: this.minFileSize.toString(), label: `Min ${this.minFileSize}MB` });
    }
    
    return filters;
  }

  onQueryChange(): void {
    if (this.searchQuery.length > 2) {
      this.generateSuggestions();
      this.showSuggestions = true;
    } else {
      this.showSuggestions = false;
    }
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions = false;
    this.onSearch();
  }

  private generateSuggestions(): void {
    // Generate suggestions based on search history and common terms
    const recentQueries = this.searchHistory.slice(0, 3).map(h => h.query);
    const commonTerms = ['vacation policy', 'company handbook', 'onboarding process', 'benefits', 'salary'];
    
    this.suggestions = [...recentQueries, ...commonTerms].filter(s => 
      s.toLowerCase().includes(this.searchQuery.toLowerCase())
    ).slice(0, 5);
  }

  private addToSearchHistory(query: string): void {
    const historyItem: SearchHistoryItem = {
      query,
      timestamp: new Date()
    };
    
    // Remove duplicates and add to front
    this.searchHistory = this.searchHistory.filter(h => h.query !== query);
    this.searchHistory.unshift(historyItem);
    
    // Keep only last 10 searches
    if (this.searchHistory.length > 10) {
      this.searchHistory = this.searchHistory.slice(0, 10);
    }
    
    this.saveSearchHistory();
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        this.searchHistory = JSON.parse(saved);
      } catch (e) {
        this.searchHistory = [];
      }
    }
  }

  private saveSearchHistory(): void {
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
}

export interface AdvancedSearchParams {
  query: string;
  fileTypes?: string[];
  dateRange?: { start: Date | null; end: Date | null };
  fileSizeRange?: { min: number | null; max: number | null };
  knowledgeBases?: string[];
}
