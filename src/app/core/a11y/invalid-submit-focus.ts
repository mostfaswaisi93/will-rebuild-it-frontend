import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  inject,
} from '@angular/core';

/**
 * Natively focusable controls, in the order a browser would tab through them.
 * A `<fieldset>` carrying a group-level error is not one of them, which is why
 * `resolveTarget` looks inside a non-focusable match rather than focusing it.
 */
const FOCUSABLE = 'input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Takes the user to the first field in error whenever a form is submitted and
 * refused.
 *
 * Twenty-three forms call `markAllAsTouched()` (or flip a `submitted` signal)
 * and then stop. That paints the messages, which is enough if you can see them:
 * the eye finds red text on its own. Nothing else happens — focus stays on the
 * submit button, so a screen-reader or keyboard-only user is told nothing at
 * all and has to walk back up the form guessing which field objected. Wiring
 * `aria-describedby` (see the audit's `form-error` check) fixed *what* they
 * hear on arrival; this fixes *getting there*. WCAG 3.3.1.
 *
 * It listens for the native `submit` event on the document rather than being a
 * directive each form imports, and that is deliberate. A directive would have
 * to be remembered in twenty-three `imports` arrays and in every form written
 * after this one — and the twenty-fourth is exactly where it would be
 * forgotten, silently, with nothing to catch it. This project has taken the
 * same decision before, for the same reason: the motion tokens are applied once
 * in `@layer base` rather than per control, and the stale-response bug was
 * fixed in the interceptor rather than on each detail page.
 *
 * The target is `[aria-invalid="true"]`, which is precisely the set of controls
 * showing an error — the previous fix is what made that true app-wide. Note the
 * exact match: valid controls render `aria-invalid="false"`, and an attribute
 * presence selector would land on the first *valid* field instead.
 */
@Injectable({ providedIn: 'root' })
export class InvalidSubmitFocus {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private listener?: (event: Event) => void;

  /**
   * Called once, from the root component.
   *
   * The listener is torn down with the injector that owns it. In the running
   * app that injector never dies, so this looks like ceremony — but without it
   * a listener outlives its injector and `afterNextRender` throws NG0205 on the
   * next submit. The suite caught exactly that: each spec installed another
   * listener, and the ones belonging to torn-down TestBeds kept firing.
   */
  install(): void {
    if (!isPlatformBrowser(this.platformId) || this.listener) {
      return;
    }
    this.listener = (event: Event) => this.onSubmit(event);
    this.document.addEventListener('submit', this.listener);
    this.destroyRef.onDestroy(() => {
      if (this.listener) {
        this.document.removeEventListener('submit', this.listener);
        this.listener = undefined;
      }
    });
  }

  private onSubmit(event: Event): void {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    // The error state is painted by the change detection pass that this very
    // event triggers, so the DOM does not carry it yet. Wait for that render
    // rather than for a timer, which would be a race dressed up as a delay.
    afterNextRender(
      () => {
        const target = this.resolveTarget(form);
        if (!target) {
          return; // The form was valid, or nothing marks itself invalid.
        }
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'center', behavior: this.scrollBehaviour() });
      },
      { injector: this.injector },
    );
  }

  /**
   * `styles.css` disables every animation under `prefers-reduced-motion`, but a
   * CSS rule cannot reach an explicit `behavior: 'smooth'` passed here — that
   * argument wins over `scroll-behavior`. So the preference is read directly,
   * or this one scroll would be the single thing in the app that still moves
   * for someone who asked it not to.
   */
  private scrollBehaviour(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  /**
   * The first field in error, or — when the error belongs to a group, as with
   * the trades fieldset and the damage report's address — the first control
   * inside it, since a `<fieldset>` cannot take focus.
   */
  private resolveTarget(form: HTMLFormElement): HTMLElement | null {
    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!invalid) {
      return null;
    }
    return invalid.matches(FOCUSABLE) ? invalid : invalid.querySelector<HTMLElement>(FOCUSABLE);
  }
}
