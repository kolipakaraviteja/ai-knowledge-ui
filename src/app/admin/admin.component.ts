import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AdminService, User, CreateUserRequest } from '../core/services/admin.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  users: User[] = [];
  loading = true;
  error: string | null = null;
  displayedColumns: string[] = ['username', 'email', 'role', 'createdAt', 'actions'];
  
  showCreateUserForm = false;
  newUser: CreateUserRequest = {
    email: '',
    username: '',
    password: '',
    role: 'USER'
  };
  creatingUser = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  toggleCreateUserForm(): void {
    this.showCreateUserForm = !this.showCreateUserForm;
    if (!this.showCreateUserForm) {
      this.resetNewUser();
    }
  }

  resetNewUser(): void {
    this.newUser = {
      email: '',
      username: '',
      password: '',
      role: 'USER'
    };
  }

  createUser(): void {
    if (!this.newUser.email || !this.newUser.username || !this.newUser.password) {
      return;
    }

    this.creatingUser = true;
    this.adminService.createUser(this.newUser).subscribe({
      next: () => {
        this.loadUsers();
        this.toggleCreateUserForm();
        this.creatingUser = false;
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.error = 'Failed to create user';
        this.creatingUser = false;
      }
    });
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.error = 'Failed to delete user';
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get currentUser(): User | null {
    const user = this.authService.currentUserValue;
    return user ? {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt || ''
    } : null;
  }
}