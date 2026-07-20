import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

/**
 * Thin wrapper around `angularx-qrcode`'s `QRCodeComponent` (selector
 * `qrcode`, input `qrdata`). QR codes need a plain white background
 * regardless of app theme to stay scannable, so `bg-white` is hardcoded
 * here deliberately instead of using the `surface` token.
 */
@Component({
  selector: 'app-qr-code',
  imports: [QRCodeComponent],
  templateUrl: './qr-code.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCode {
  readonly value = input.required<string>();
  readonly size = input(128);
}
