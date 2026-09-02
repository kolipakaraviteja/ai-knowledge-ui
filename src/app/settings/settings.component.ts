import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  authSvc = inject(AuthService);
  private router = inject(Router);

  get currentUser() {
    return this.authSvc.currentUserValue;
  }

  get isAdmin() {
    return this.authSvc.isAdmin();
  }

  logout(): void {
    this.authSvc.logout();
  }
}
