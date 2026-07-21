import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupportTicket } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SupportApi } from '@core/api/support-api.service';
import { ToastService } from '@core/toast/toast.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * Support ticket — port of the legacy `ticket/:ticketId`. Shows the
 * conversation and lets the operator (the "support" author) reply. Reuses the
 * existing `SupportApi` and its `support.view.*` copy.
 */
@Component({
  selector: 'app-support-detail',
  imports: [ReactiveFormsModule, TranslatePipe, PageHeader, StatusPill],
  templateUrl: './support-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportDetail {
  readonly id = input.required<string>();

  private readonly api = inject(SupportApi);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getTicketDetails(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly ticket = computed<SupportTicket | null>(() => this.resource.value() ?? null);
  protected readonly isClosed = computed(() => this.ticket()?.status === 'closed');

  protected readonly reply = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });
  protected readonly sending = signal(false);

  protected send(): void {
    const ticket = this.ticket();
    if (!ticket || this.sending()) {
      return;
    }
    if (this.reply.invalid) {
      this.reply.markAsTouched();
      return;
    }

    this.sending.set(true);
    this.api
      .addMessage(ticket.id, this.reply.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.sending.set(false);
          this.resource.set(updated);
          this.reply.reset('');
          this.toast.success('support.view.replySuccess');
        },
        error: () => {
          this.sending.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
}
