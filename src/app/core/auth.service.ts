import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';

import { Role, TokenResponse } from '../models';
import { AppConfigService } from './app-config.service';

const TOKEN_KEY = 'breadhouse_token';
const ROLE_KEY = 'breadhouse_role';
const NAME_KEY = 'breadhouse_name';
const ID_KEY = 'breadhouse_id';

export interface StoredAuth {
  token: string;
  role: Role;
  name: string;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authSignal = signal<StoredAuth | null>(this.load());

  readonly current = this.authSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.authSignal() !== null);
  readonly role = computed(() => this.authSignal()?.role ?? null);

  constructor(
    private readonly http: HttpClient,
    private readonly config: AppConfigService,
  ) {}

  login(role: Role, id: string, password: string) {
    const endpoint =
      role === 'store' ? '/api/auth/store-login' : '/api/auth/warehouse-login';
    const body = role === 'store' ? { storeId: id, password } : { warehouseId: id, password };
    return this.http.post<TokenResponse>(this.config.apiUrl + endpoint, body).pipe(
      tap((res) =>
        this.persist({ token: res.token, role: res.role, name: res.name, id: res.id }),
      ),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(ID_KEY);
    this.authSignal.set(null);
  }

  private persist(auth: StoredAuth): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(ROLE_KEY, auth.role);
    localStorage.setItem(NAME_KEY, auth.name);
    localStorage.setItem(ID_KEY, auth.id);
    this.authSignal.set(auth);
  }

  private load(): StoredAuth | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const role = localStorage.getItem(ROLE_KEY);
    const name = localStorage.getItem(NAME_KEY);
    const id = localStorage.getItem(ID_KEY);
    if (!token || (role !== 'store' && role !== 'warehouse')) {
      return null;
    }
    return { token, role, name: name ?? '', id: id ?? '' };
  }
}
