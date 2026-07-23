import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  MaterialCategory,
  PagedResult,
  PurchaseOrder,
  PurchaseOrderStatus,
  StockItem,
  StockStatus,
  Warehouse,
} from '@core/models';

export interface StockFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  warehouseId?: string;
  category?: MaterialCategory;
  status?: StockStatus;
}

export interface PurchaseOrderFilters {
  pageNo: number;
  pageSize: number;
  searchKey?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
}

export interface StockSummary {
  total: number;
  low: number;
  outOfStock: number;
}

export type StockPage = PagedResult<StockItem> & { summary: StockSummary };

/** A warehouse together with everything currently held in it. */
export type WarehouseDetail = Warehouse & { stock: StockItem[]; summary: StockSummary };

export interface PurchaseOrderLineInput {
  description: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  unitRate: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  warehouseId: string;
  expectedDelivery?: string;
  lines: PurchaseOrderLineInput[];
}

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- Warehouses ---
  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.base}/warehouses`);
  }

  getWarehouse(id: string): Observable<WarehouseDetail> {
    return this.http.get<WarehouseDetail>(`${this.base}/warehouses/${id}`);
  }

  getStockItem(id: string): Observable<StockItem> {
    return this.http.get<StockItem>(`${this.base}/stock/${id}`);
  }

  // --- Stock ---
  listStock(filters: StockFilters): Observable<StockPage> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'warehouseId', 'category', 'status'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<StockPage>(`${this.base}/stock`, { params });
  }

  // --- Purchase orders ---
  listPurchaseOrders(filters: PurchaseOrderFilters): Observable<PagedResult<PurchaseOrder>> {
    let params = new HttpParams().set('pageNo', filters.pageNo).set('pageSize', filters.pageSize);
    for (const key of ['searchKey', 'status', 'supplierId'] as const) {
      const value = filters[key];
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<PagedResult<PurchaseOrder>>(`${this.base}/purchase-orders`, { params });
  }

  createPurchaseOrder(payload: CreatePurchaseOrderPayload): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/purchase-orders`, payload);
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.base}/purchase-orders/${id}`);
  }

  transitionPurchaseOrder(id: string, status: PurchaseOrderStatus): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/purchase-orders/${id}/transition`, { status });
  }
}
