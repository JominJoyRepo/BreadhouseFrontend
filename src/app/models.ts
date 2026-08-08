export type Role = 'store' | 'warehouse';

export interface ItemInfo {
  name: string;
  unit: string;
}

export interface ItemCategory {
  category: string;
  items: ItemInfo[];
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
  unit: string;
  total: number;
}

export interface SummaryCategory {
  category: string;
  items: SummaryRow[];
}

export interface ReportStoreItem {
  item: string;
  quantity: number;
  unit: string;
}

export interface ReportStoreCategory {
  category: string;
  items: ReportStoreItem[];
}

export interface ReportStore {
  storeId: string;
  storeName: string;
  items: ReportStoreCategory[];
}

export interface WarehouseReport {
  date: string | null;
  summary: SummaryCategory[];
  stores: ReportStore[];
}
