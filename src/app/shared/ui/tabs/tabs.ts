import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';
import { TranslatePipe } from '@core/i18n/translate.pipe';

export interface TabItem {
  id: string;
  labelKey: string;
}

/**
 * Headless ARIA tablist — renders only the tab-strip buttons. The calling
 * component is responsible for conditionally rendering the tab panel
 * content itself based on the active tab id.
 */
@Component({
  selector: 'app-tabs',
  imports: [TranslatePipe],
  templateUrl: './tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tabs {
  readonly tabs = input.required<TabItem[]>();
  readonly activeId = model<string>('');

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected selectTab(id: string): void {
    this.activeId.set(id);
  }

  /**
   * Standard ARIA tablist keyboard support: Arrow keys move focus/selection
   * to the next or previous tab in DOM order (visual order already reads
   * correctly per `dir`, so no RTL-specific key mapping is needed), Home/End
   * jump to the first/last tab.
   */
  protected onKeydown(event: KeyboardEvent, index: number): void {
    const items = this.tabs();
    if (items.length === 0) {
      return;
    }

    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextItem = items[nextIndex];
    this.activeId.set(nextItem.id);
    this.tabButtons()[nextIndex]?.nativeElement.focus();
  }
}
