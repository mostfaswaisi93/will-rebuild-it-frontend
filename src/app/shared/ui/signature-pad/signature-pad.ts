import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import SignaturePadLib from 'signature_pad';
import { LucidePenLine, LucideType } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';

/**
 * Wraps the `signature_pad` npm package. Not a `ControlValueAccessor` —
 * signatures are captured on demand, not bound like a plain form value.
 * Exposes a "draw" mode (canvas + `signature_pad`) and a "type your name"
 * mode (styled text substituting for a dedicated script font), and emits a
 * base64 PNG data URL via `signatureCaptured` when the caller confirms.
 *
 * Canvas/signature capture is browser-only; all `signature_pad`
 * initialization is guarded by `isPlatformBrowser`.
 */
@Component({
  selector: 'app-signature-pad',
  imports: [TranslatePipe, LucidePenLine, LucideType],
  templateUrl: './signature-pad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignaturePad implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly signatureCaptured = output<string>();

  protected readonly mode = signal<'draw' | 'type'>('draw');
  protected readonly isEmpty = signal(true);
  protected readonly typedName = signal('');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('signatureCanvas');
  private pad: SignaturePadLib | undefined;
  private resizeHandler: (() => void) | undefined;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    this.pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#14201b',
    });
    this.pad.addEventListener('endStroke', () => {
      this.isEmpty.set(this.pad?.isEmpty() ?? true);
    });

    this.resizeCanvas(canvas);
    this.resizeHandler = () => this.resizeCanvas(canvas);
    window.addEventListener('resize', this.resizeHandler);

    this.destroyRef.onDestroy(() => {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
      this.pad?.off();
    });
  }

  /**
   * Scales the canvas backing store by devicePixelRatio so strokes stay
   * crisp on high-DPI screens, per the `signature_pad` docs' recommended
   * resize handling. This clears any in-progress strokes, which is
   * acceptable here since resize only realistically fires on initial layout
   * or an orientation change, not mid-signature.
   */
  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx?.scale(ratio, ratio);
    this.pad?.clear();
    this.isEmpty.set(true);
  }

  protected setMode(mode: 'draw' | 'type'): void {
    this.mode.set(mode);
    this.clear();
  }

  protected clear(): void {
    this.pad?.clear();
    this.isEmpty.set(true);
    this.typedName.set('');
  }

  protected onTypedNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.typedName.set(input.value);
    this.isEmpty.set(input.value.trim().length === 0);
  }

  protected confirm(): void {
    if (this.isEmpty()) {
      return;
    }
    if (this.mode() === 'draw') {
      const dataUrl = this.pad?.toDataURL('image/png');
      if (dataUrl) {
        this.signatureCaptured.emit(dataUrl);
      }
      return;
    }
    const dataUrl = this.renderTypedSignatureToDataUrl(this.typedName());
    if (dataUrl) {
      this.signatureCaptured.emit(dataUrl);
    }
  }

  private renderTypedSignatureToDataUrl(name: string): string | null {
    if (!isPlatformBrowser(this.platformId) || !name.trim()) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#14201b';
    ctx.font = 'italic 56px "IBM Plex Sans Arabic", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.trim(), canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }
}
