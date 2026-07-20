import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideLoader2 } from '@lucide/angular';

/** Small inline spinning indicator for buttons, inline loading states, etc. */
@Component({
  selector: 'app-spinner',
  imports: [LucideLoader2],
  templateUrl: './spinner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Spinner {
  readonly size = input(20);
  readonly tone = input<'brand' | 'white'>('brand');
}
