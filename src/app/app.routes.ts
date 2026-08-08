import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'store',
    canActivate: [authGuard('store')],
    loadComponent: () =>
      import('./pages/store/store.component').then((m) => m.StoreComponent),
  },
  {
    path: 'warehouse',
    canActivate: [authGuard('warehouse')],
    loadComponent: () =>
      import('./pages/warehouse/warehouse.component').then((m) => m.WarehouseComponent),
  },
  { path: '**', redirectTo: 'login' },
];
