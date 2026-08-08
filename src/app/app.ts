import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'Breadhouse';
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly auth = this.authService;

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
