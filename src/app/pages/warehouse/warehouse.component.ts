import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
import { formatDisplayDate } from '../../core/date-format';
import { errorMessage } from '../../core/errors';
import { WarehouseReport } from '../../models';

const POLL_INTERVAL_MS = 30_000;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function toIso(value: Date | null): string {
  return value instanceof Date ? toIsoDate(value) : toIsoDate(tomorrow());
}

@Component({
  selector: 'app-warehouse',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './warehouse.component.html',
  styleUrl: './warehouse.component.scss',
})
export class WarehouseComponent implements OnInit, OnDestroy {
  protected readonly dateControl = new FormControl<Date>(tomorrow());

  private readonly dateValue = signal(toIso(tomorrow()));
  protected readonly selectedDate = computed(() => this.dateValue());
  protected readonly displayDate = formatDisplayDate;
  protected readonly report = signal<WarehouseReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly lastUpdated = signal<string | null>(null);

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

  protected openPicker(picker: MatDatepicker<Date>): void {
    picker.open();
  }

  /** Polls on an interval, on tab focus, on date change and on manual refresh. */
  private buildRefreshStream() {
    const tabFocus$ = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
    );
    const windowFocus$ = fromEvent(window, 'focus');
    const dateChange$ = this.dateControl.valueChanges.pipe(
      tap((value) => this.dateValue.set(toIso(value))),
    );
    return merge(timer(0, POLL_INTERVAL_MS), this.refresh$, tabFocus$, windowFocus$, dateChange$).pipe(
      switchMap(() => this.pollOnce()),
    );
  }

  private pollOnce(): Observable<WarehouseReport | void> {
    this.loading.set(true);
    this.loadError.set(null);
    return this.api.getReport(this.selectedDate()).pipe(
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
