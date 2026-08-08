import { KeyValuePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  filter,
  fromEvent,
  merge,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/errors';
import { ReportStore, WarehouseReport } from '../../models';

const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-warehouse',
  imports: [
    KeyValuePipe,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './warehouse.component.html',
  styleUrl: './warehouse.component.scss',
})
export class WarehouseComponent implements OnInit, OnDestroy {
  protected readonly dates = signal<string[]>([]);
  protected readonly selectedDate = signal<string>('');
  protected readonly report = signal<WarehouseReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly lastUpdated = signal<string | null>(null);

  protected readonly totalAll = computed(() =>
    (this.report()?.summary ?? []).reduce((sum, row) => sum + row.total, 0),
  );

  private readonly refresh$ = new Subject<void>();
  private refreshSubscription: Subscription | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.refreshSubscription = this.buildRefreshStream().subscribe();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  protected refresh(): void {
    this.refresh$.next();
  }

  protected onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.refresh$.next();
  }

  protected storeTotal(store: ReportStore): number {
    return Object.values(store.items).reduce((sum, qty) => sum + qty, 0);
  }

  /** Polls on an interval, on tab focus and on manual refresh. */
  private buildRefreshStream() {
    const tabFocus$ = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
    );
    const windowFocus$ = fromEvent(window, 'focus');
    return merge(timer(0, POLL_INTERVAL_MS), this.refresh$, tabFocus$, windowFocus$).pipe(
      switchMap(() => this.pollOnce()),
    );
  }

  private pollOnce(): Observable<WarehouseReport | void> {
    this.loading.set(true);
    this.loadError.set(null);
    return this.api.getAvailableDates().pipe(
      switchMap(({ dates }) => {
        this.dates.set(dates);
        this.selectedDate.set(this.selectedDate() || dates[dates.length - 1] || '');
        return this.api.getReport(this.selectedDate() || null);
      }),
      tap((report) => {
        this.report.set(report);
        this.lastUpdated.set(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        );
        this.loading.set(false);
      }),
      catchError((err) => {
        this.loading.set(false);
        this.loadError.set(errorMessage(err));
        return of(void 0);
      }),
    );
  }
}
