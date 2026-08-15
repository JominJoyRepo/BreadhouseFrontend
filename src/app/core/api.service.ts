import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ItemCategory, ItemQuantity, RequirementSubmission, WarehouseReport } from '../models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: AppConfigService,
  ) {}

  getItems() {
    return this.http.get<ItemCategory[]>(`${this.config.apiUrl}/api/items`);
  }

  getMyRequirements(date: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.http.get<{
      submissions: RequirementSubmission[];
      previous: RequirementSubmission | null;
    }>(`${this.config.apiUrl}/api/requirements/mine${query}`);
  }

  submitRequirements(date: string, items: ItemQuantity[]) {
    return this.http.post<{ ok: boolean }>(`${this.config.apiUrl}/api/requirements`, {
      date,
      items,
    });
  }

  getReport(date: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.http.get<WarehouseReport>(`${this.config.apiUrl}/api/requirements${query}`);
  }

  exportReport(date: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.http.get(`${this.config.apiUrl}/api/requirements/export${query}`, {
      responseType: 'blob',
    });
  }
}
