import { HttpErrorResponse } from '@angular/common/http';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  filter,
  firstValueFrom,
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
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
  protected readonly exporting = signal(false);

  private readonly refresh$ = new Subject<void>();
  private refreshSubscription: Subscription | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly snackbar: MatSnackBar,
  ) {}

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

  protected async downloadReport(): Promise<void> {
    if (this.exporting()) {
      return;
    }
    const date = this.selectedDate();
    this.exporting.set(true);
    try {
      const blob = await firstValueFrom(this.api.exportReport(date));
      if (!blob) {
        throw new Error('Empty response');
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = date ? `requirements_${date}.xlsx` : 'requirements_all-dates.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
      this.snackbar.open('Report downloaded', 'OK', { duration: 2500 });
    } catch (err) {
      this.snackbar.open(await this.exportErrorMessage(err), 'OK', { duration: 4000 });
    } finally {
      this.exporting.set(false);
    }
  }

  private async exportErrorMessage(err: unknown): Promise<string> {
    if (err instanceof HttpErrorResponse && err.error instanceof Blob) {
      try {
        const body = JSON.parse(await err.error.text()) as { detail?: string };
        if (body?.detail) {
          return body.detail;
        }
      } catch {
        // fall through to the generic message
      }
    }
    return errorMessage(err);
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
