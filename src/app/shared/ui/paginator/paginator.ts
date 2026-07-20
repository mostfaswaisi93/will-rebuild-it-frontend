import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Server-side pagination control: Previous/Next + a compact "Page X of Y"
 * indicator. Deliberately does not render individual page-number buttons.
 */
@Component({
  selector: 'app-paginator',
  imports: [LucideChevronLeft, LucideChevronRight, TranslatePipe],
  templateUrl: './paginator.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  readonly pageNo = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / Math.max(1, this.pageSize()))),
  );

  protected readonly hasPrevious = computed(() => this.pageNo() > 1);
  protected readonly hasNext = computed(() => this.pageNo() < this.totalPages());

  protected goPrevious(): void {
    if (this.hasPrevious()) {
      this.pageChange.emit(this.pageNo() - 1);
    }
  }

  protected goNext(): void {
    if (this.hasNext()) {
      this.pageChange.emit(this.pageNo() + 1);
    }
  }
}
