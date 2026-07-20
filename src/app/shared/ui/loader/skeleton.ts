import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card';

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  title: 'h-6 w-1/2 rounded',
  avatar: 'h-10 w-10 rounded-full',
  card: 'h-32 w-full rounded-card',
};

/** Pulsing placeholder block used while real content is loading. */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('text');

  protected readonly variantClasses = computed(() => VARIANT_CLASSES[this.variant()]);
}
