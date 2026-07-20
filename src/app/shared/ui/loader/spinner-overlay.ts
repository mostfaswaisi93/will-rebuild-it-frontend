import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Spinner } from './spinner';

/**
 * Loading veil that covers its parent element while `active()` is true.
 * NOTE: the parent element must carry a Tailwind `relative` class (or
 * otherwise establish a CSS positioning context) for this overlay's
 * `absolute inset-0` to cover it correctly.
 */
@Component({
  selector: 'app-spinner-overlay',
  imports: [Spinner],
  templateUrl: './spinner-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerOverlay {
  readonly active = input(false);
}
