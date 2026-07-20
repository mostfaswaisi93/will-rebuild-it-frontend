import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  input,
  model,
  signal,
} from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export interface CarouselPhoto {
  url: string;
  fileName?: string;
}

/**
 * Full-screen photo viewer for browsing damage/progress photos. Despite the
 * name it is a self-contained fixed-position overlay — it does not depend
 * on any shared Modal/Dialog service.
 */
@Component({
  selector: 'app-carousel-modal',
  imports: [LucideChevronLeft, LucideChevronRight, LucideX, TranslatePipe],
  templateUrl: './carousel-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarouselModal {
  readonly open = model<boolean>(false);
  readonly photos = input<CarouselPhoto[]>([]);
  readonly startIndex = input(0);

  protected readonly currentIndex = signal(0);
  protected readonly total = computed(() => this.photos().length);
  protected readonly currentPhoto = computed(() => this.photos()[this.currentIndex()]);

  constructor() {
    effect(() => {
      if (this.open()) {
        this.currentIndex.set(this.startIndex());
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected previous(): void {
    const count = this.total();
    if (count === 0) {
      return;
    }
    this.currentIndex.set((this.currentIndex() - 1 + count) % count);
  }

  protected next(): void {
    const count = this.total();
    if (count === 0) {
      return;
    }
    this.currentIndex.set((this.currentIndex() + 1) % count);
  }
}
