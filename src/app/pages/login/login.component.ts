import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { Role } from '../../models';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly activeRole = signal<Role>('store');

  protected readonly storeForm = this.fb.nonNullable.group({
    storeId: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly warehouseForm = this.fb.nonNullable.group({
    warehouseId: ['', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.redirectByRole();
    }
  }

  protected onTabChange(index: number): void {
    this.activeRole.set(index === 0 ? 'store' : 'warehouse');
  }

  protected submit(): void {
    if (this.loading()) {
      return;
    }
    const role = this.activeRole();
    if (role === 'store' && this.storeForm.invalid) {
      this.snackbar.open('Please fill in all fields', 'OK', { duration: 3000 });
      return;
    }
    if (role === 'warehouse' && this.warehouseForm.invalid) {
      this.snackbar.open('Please fill in all fields', 'OK', { duration: 3000 });
      return;
    }
    const id =
      role === 'store' ? (this.storeForm.value.storeId ?? '') : (this.warehouseForm.value.warehouseId ?? '');
    const password =
      role === 'store' ? (this.storeForm.value.password ?? '') : (this.warehouseForm.value.password ?? '');

    this.loading.set(true);
    this.auth.login(role, id, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackbar.open('Logged in successfully', 'OK', { duration: 2000 });
        this.redirectByRole();
      },
      error: (err) => {
        this.loading.set(false);
        this.snackbar.open(errorMessage(err), 'OK', { duration: 4000 });
      },
    });
  }

  private redirectByRole(): void {
    const role = this.auth.role();
    this.router.navigate([role === 'store' ? '/store' : '/warehouse']);
  }
}
