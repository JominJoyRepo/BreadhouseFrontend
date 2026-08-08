import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ItemCategory, ItemQuantity, RequirementSubmission, WarehouseReport } from '../models';
import { environment } from './env';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getItems() {
    return this.http.get<ItemCategory[]>(`${environment.apiUrl}/api/items`);
  }

  getMyRequirements() {
    return this.http.get<{ submissions: RequirementSubmission[] }>(
      `${environment.apiUrl}/api/requirements/mine`,
    );
  }

  submitRequirements(date: string, items: ItemQuantity[]) {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/api/requirements`, {
      date,
      items,
    });
  }

  getAvailableDates() {
    return this.http.get<{ dates: string[] }>(
      `${environment.apiUrl}/api/requirements/dates`,
    );
  }

  getReport(date: string | null) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.http.get<WarehouseReport>(`${environment.apiUrl}/api/requirements${query}`);
  }
}
