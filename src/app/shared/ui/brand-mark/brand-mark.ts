import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The platform's brand mark: four archway tiles on a 2x2 grid, alternating
 * emerald and sand. Two are solid blocks and two are open archways — the
 * motif reads as building blocks becoming doorways, i.e. a home rebuilt and
 * reopened. Colors come from the design tokens so the mark tracks any
 * re-skin, and the arch geometry echoes the architecture of the region.
 *
 * The wordmark is intentionally NOT part of this SVG: it is bilingual and
 * lives as real HTML text next to the mark, so it stays selectable,
 * translatable, and crisp at any size.
 */
@Component({
  selector: 'app-brand-mark',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      [attr.aria-label]="label()"
      class="shrink-0"
    >
      <!-- top-left: open archway, emerald -->
      <path
        d="M0 11 L0 19 Q0 22 3 22 L19 22 Q22 22 22 19 L22 11 A11 11 0 0 0 0 11 Z
           M6 22 L6 11 A5 5 0 0 1 16 11 L16 22 Z"
        fill-rule="evenodd"
        [attr.fill]="emerald()"
      />
      <!-- top-right: solid block, sand -->
      <path
        d="M26 11 L26 19 Q26 22 29 22 L45 22 Q48 22 48 19 L48 11 A11 11 0 0 0 26 11 Z"
        [attr.fill]="sand()"
      />
      <!-- bottom-left: solid block, sand -->
      <path
        d="M0 37 L0 45 Q0 48 3 48 L19 48 Q22 48 22 45 L22 37 A11 11 0 0 0 0 37 Z"
        [attr.fill]="sand()"
      />
      <!-- bottom-right: open archway, emerald -->
      <path
        d="M26 37 L26 45 Q26 48 29 48 L45 48 Q48 48 48 45 L48 37 A11 11 0 0 0 26 37 Z
           M32 48 L32 37 A5 5 0 0 1 42 37 L42 48 Z"
        fill-rule="evenodd"
        [attr.fill]="emerald()"
      />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandMark {
  readonly size = input(32);
  readonly label = input('Gaza Reconstruction Platform');
  /** Overridable so the mark can sit on the dark sidebar as well as light surfaces. */
  readonly emerald = input('var(--color-brand-500)');
  readonly sand = input('var(--color-sand-500)');
}
