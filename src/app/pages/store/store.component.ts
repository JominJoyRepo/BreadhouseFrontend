import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, forkJoin } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { errorMessage } from '../../core/errors';
import { ItemCategory, ItemQuantity, RequirementSubmission } from '../../models';

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tomorrowIso(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toIsoDate(tomorrow);
}

@Component({
  selector: 'app-store',
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
  ],
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss',
})
export class StoreComponent implements OnInit, OnDestroy {
  protected readonly categories = signal<ItemCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly savedDate = signal<string | null>(null);
  protected readonly dateControl = new FormControl<string>(tomorrowIso());

  protected readonly selectedDate = computed(() => this.dateControl.value ?? tomorrowIso());
  protected readonly todayIso = computed(() => toIsoDate(new Date()));
  protected readonly itemCount = computed(() =>
    this.categories().reduce((sum, category) => sum + category.items.length, 0),
  );
  protected readonly savedCount = computed(() =>
    this.savedDate() === this.selectedDate() ? this.savedItems().length : 0,
  );

  private readonly controls = new Map<string, FormControl<number | null>>();
  private readonly submissions: RequirementSubmission[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly snackbar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.dateControl.valueChanges.subscribe(() => this.applyStoredQuantities()),
    );
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  protected retryLoad(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.subscriptions.push(
      forkJoin({ items: this.api.getItems(), mine: this.api.getMyRequirements() }).subscribe({
        next: ({ items, mine }) => {
          this.categories.set(items);
          this.submissions.push(...mine.submissions);
          this.buildControls(items);
          this.applyStoredQuantities();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(errorMessage(err));
        },
      }),
    );
  }

  protected qty(item: string): FormControl<number | null> {
    return this.controls.get(item) ?? new FormControl<number | null>(0);
  }

  protected categoryTotal(category: ItemCategory): number {
    return category.items.reduce(
      (sum, item) => sum + (this.controls.get(item)?.value ?? 0),
      0,
    );
  }

  protected setToday(): void {
    this.dateControl.setValue(this.todayIso());
  }

  protected openPicker(picker: MatDatepicker<string>): void {
    picker.open();
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    const items: ItemQuantity[] = [];
    for (const [item, control] of this.controls) {
      const quantity = control.value ?? 0;
      if (quantity > 0) {
        items.push({ item, quantity });
      }
    }

    this.saving.set(true);
    this.api.submitRequirements(this.selectedDate(), items).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedDate.set(this.selectedDate());
        this.snackbar.open(`Requirements saved for ${this.selectedDate()}`, 'OK', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackbar.open(errorMessage(err), 'OK', { duration: 4000 });
      },
    });
  }

  private buildControls(items: ItemCategory[]): void {
    for (const category of items) {
      for (const item of category.items) {
        if (!this.controls.has(item)) {
          this.controls.set(item, new FormControl<number | null>(0));
        }
      }
    }
  }

  private applyStoredQuantities(): void {
    const existing = this.submissions.find((s) => s.date === this.selectedDate());
    this.savedDate.set(existing ? existing.date : null);
    const quantities = new Map<string, number>();
    if (existing) {
      for (const entry of existing.items) {
        quantities.set(entry.item, entry.quantity);
      }
    }
    for (const [item, control] of this.controls) {
      control.setValue(quantities.get(item) ?? 0, { emitEvent: false });
    }
  }

  private savedItems(): ItemQuantity[] {
    const existing = this.submissions.find((s) => s.date === this.selectedDate());
    return existing?.items ?? [];
  }
}
