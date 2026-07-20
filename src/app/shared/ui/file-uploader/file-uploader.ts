import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideCircleAlert, LucideRefreshCw, LucideUpload, LucideX } from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { ToastService } from '@core/toast/toast.service';

export interface UploadableFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'paused';
}

/**
 * Multi-file picker with client-simulated upload progress. There is no real
 * upload endpoint in this phase, so `startSimulatedUpload` below fakes
 * progress with `setInterval`. A future developer wiring a real `UploadApi`
 * should replace that method's body with actual `HttpClient` upload-progress
 * events (`HttpEventType.UploadProgress`) and drop the `setInterval` entirely
 * — the rest of the component (queueing, offline pause/resume, retry,
 * removal, preview-URL cleanup) is upload-mechanism-agnostic and can stay.
 */
@Component({
  selector: 'app-file-uploader',
  imports: [TranslatePipe, LucideUpload, LucideX, LucideRefreshCw, LucideCircleAlert],
  templateUrl: './file-uploader.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploader {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly files = model<UploadableFile[]>([]);
  readonly multiple = input(true);
  readonly accept = input('image/*');
  readonly maxFiles = input(10);

  protected readonly isOffline = signal(
    isPlatformBrowser(this.platformId) && typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly intervals = new Map<string, ReturnType<typeof setInterval>>();

  private readonly handleOffline = (): void => {
    this.isOffline.set(true);
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    this.files.update((list) =>
      list.map((item) =>
        item.status === 'uploading' || item.status === 'queued' ? { ...item, status: 'paused' } : item,
      ),
    );
  };

  private readonly handleOnline = (): void => {
    this.isOffline.set(false);
    for (const item of this.files()) {
      if (item.status === 'paused') {
        this.startSimulatedUpload(item.id);
      }
    }
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('online', this.handleOnline);
    }
    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        window.removeEventListener('offline', this.handleOffline);
        window.removeEventListener('online', this.handleOnline);
      }
      for (const intervalId of this.intervals.values()) {
        clearInterval(intervalId);
      }
      this.intervals.clear();
      for (const item of this.files()) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  }

  protected triggerFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files ? Array.from(input.files) : [];
    input.value = '';
    this.addFiles(selected);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const dropped = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.addFiles(dropped);
  }

  private addFiles(selected: File[]): void {
    if (selected.length === 0) {
      return;
    }

    const capacity = this.maxFiles() - this.files().length;
    if (capacity <= 0) {
      this.toast.danger('shared.fileUploader.tooManyFiles', { max: this.maxFiles() });
      return;
    }

    const accepted = selected.slice(0, capacity);
    if (accepted.length < selected.length) {
      this.toast.danger('shared.fileUploader.tooManyFiles', { max: this.maxFiles() });
    }

    const newEntries: UploadableFile[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'queued',
    }));

    this.files.update((list) => [...list, ...newEntries]);
    for (const entry of newEntries) {
      this.startSimulatedUpload(entry.id);
    }
  }

  protected removeFile(id: string): void {
    const target = this.files().find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    this.files.update((list) => list.filter((item) => item.id !== id));
  }

  protected retry(id: string): void {
    this.files.update((list) =>
      list.map((item) => (item.id === id ? { ...item, status: 'queued', progress: 0 } : item)),
    );
    this.startSimulatedUpload(id);
  }

  /** See the class-level comment: this is a client-only progress simulation, not a real network transfer. */
  private startSimulatedUpload(id: string): void {
    if (!isPlatformBrowser(this.platformId) || this.isOffline()) {
      return;
    }

    this.files.update((list) => list.map((item) => (item.id === id ? { ...item, status: 'uploading' } : item)));

    const durationMs = 1500 + Math.random() * 1500;
    const tickMs = 120;
    const baseIncrement = 100 / (durationMs / tickMs);

    const intervalId = setInterval(() => {
      let finished = false;
      this.files.update((list) =>
        list.map((item) => {
          if (item.id !== id || item.status !== 'uploading') {
            return item;
          }
          const nextProgress = Math.min(100, item.progress + baseIncrement * (0.7 + Math.random() * 0.6));
          if (nextProgress >= 100) {
            finished = true;
            return { ...item, progress: 100, status: 'done' };
          }
          return { ...item, progress: nextProgress };
        }),
      );
      if (finished) {
        clearInterval(intervalId);
        this.intervals.delete(id);
      }
    }, tickMs);

    this.intervals.set(id, intervalId);
  }
}
