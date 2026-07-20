import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Live-formats a Gaza mobile number as the user types: strips non-digit
 * characters and groups the remaining digits `59 123 4567` (2-3-4), capped
 * at 9 digits — the length of a Gaza mobile number once the +970 country
 * code / leading 0 is stripped. Applied directly to a raw `<input>` (see
 * `PhoneInput`, which uses it on its own inner input).
 *
 * Note: reformatting always moves the caret to the end of the value, which
 * is a known/acceptable simplification for a lightweight mask directive —
 * editing in the middle of an already-typed number will jump the caret.
 */
@Directive({
  selector: '[appPhoneMask]',
})
export class PhoneMaskDirective {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = (event.target as HTMLInputElement) ?? this.elementRef.nativeElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    input.value = this.group(digits);
  }

  private group(digits: string): string {
    const part1 = digits.slice(0, 2);
    const part2 = digits.slice(2, 5);
    const part3 = digits.slice(5, 9);
    return [part1, part2, part3].filter(Boolean).join(' ');
  }
}
