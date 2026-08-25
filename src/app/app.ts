import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { SidebarComponent } from './shared/sidebar.component';
import { FooterComponent } from './shared/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="d-flex flex-column h-100">
      <app-navbar></app-navbar>
      <div class="flex-grow-1 d-flex overflow-hidden">
        <app-sidebar></app-sidebar>
        <main class="flex-grow-1 overflow-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    :host {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class App {}

