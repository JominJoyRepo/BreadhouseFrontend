import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiUrl: string;
}

const DEFAULT_CONFIG: AppConfig = {
  apiUrl: 'http://localhost:8000',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private config: AppConfig = DEFAULT_CONFIG;

  async load(): Promise<AppConfig> {
    try {
      this.config = await firstValueFrom(this.http.get<AppConfig>('/config.json'));
    } catch {
      this.config = DEFAULT_CONFIG;
    }
    return this.config;
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }
}
