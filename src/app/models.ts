export type Role = 'store' | 'warehouse';

export interface ItemCategory {
  category: string;
  items: string[];
}

export interface TokenResponse {
  token: string;
  role: Role;
  id: string;
  name: string;
}

export interface ItemQuantity {
  item: string;
  quantity: number;
}

export interface RequirementSubmission {
  date: string;
  storeId: string;
  storeName: string;
  items: ItemQuantity[];
}

export interface SummaryRow {
  item: string;
  total: number;
}

export interface ReportStore {
  storeId: string;
  storeName: string;
  items: Record<string, number>;
}

export interface WarehouseReport {
  date: string | null;
  summary: SummaryRow[];
  stores: ReportStore[];
}
