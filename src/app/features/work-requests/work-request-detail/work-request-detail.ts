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
import { Router } from '@angular/router';
import { ReconstructionRequest, Team } from '@core/models';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { WorkRequestsApi } from '@core/api/work-requests-api.service';
import { TeamsApi } from '@core/api/teams-api.service';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ConfirmDialog, ConfirmDialogData } from '@shared/ui/confirm-dialog/confirm-dialog';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatusPill } from '@shared/ui/status-pill/status-pill';

/**
 * Reconstruction-request detail — ports the legacy `admin-lead-details` and
 * `pro-lead-details` into one page whose actions are gated by role.
 *
 * The legacy page's marketplace fields (purchase price, purchase date, booking
 * slot) are dropped: reconstruction requests are assigned by an operator, not
 * bought by a contractor, so there is no price or purchase to show. Assignment
 * and rejection — admin-only — take their place.
 */
@Component({
  selector: 'app-work-request-detail',
  imports: [TranslatePipe, PageHeader, StatusPill],
  templateUrl: './work-request-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkRequestDetail {
  /** Bound from the route param via `withComponentInputBinding`. */
  readonly id = input.required<string>();

  private readonly api = inject(WorkRequestsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly resource = rxResource({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.getById(params.id),
  });

  protected readonly loading = computed(() => this.resource.isLoading());
  protected readonly failed = computed(() => this.resource.error() !== undefined);
  protected readonly request = computed<ReconstructionRequest | null>(
    () => this.resource.value() ?? null,
  );

  protected readonly isAdmin = computed(() => this.session.role() === 'admin');
  protected readonly assignedTeam = computed(
    () => this.request()?.matchedTeams.find((team) => team.status === 'assigned') ?? null,
  );
  protected readonly suggestedTeams = computed(
    () => this.request()?.matchedTeams.filter((team) => team.status === 'suggested') ?? [],
  );

  /** An operator can still act while the request has no final decision. */
  protected readonly canDecide = computed(() => {
    const status = this.request()?.status;
    return this.isAdmin() && status !== undefined && status !== 'accepted' && status !== 'rejected';
  });

  private readonly teams = rxResource({
    stream: () => this.teamsApi.getTeams({ pageNo: 1, pageSize: 100 }),
  });
  protected readonly teamOptions = computed<Team[]>(() => this.teams.value()?.items ?? []);

  protected readonly selectedTeamId = signal('');
  protected readonly assigning = signal(false);

  protected assign(): void {
    const request = this.request();
    const teamId = this.selectedTeamId();
    if (!request || !teamId || this.assigning()) {
      return;
    }

    this.assigning.set(true);
    this.api
      .assignTeam(request.id, teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.assigning.set(false);
          this.resource.set(updated);
          this.selectedTeamId.set('');
          this.toast.success('workRequests.detail.assigned');
        },
        error: () => {
          this.assigning.set(false);
          this.toast.danger('common.errorGeneric');
        },
      });
  }

  protected reject(): void {
    const request = this.request();
    if (!request) {
      return;
    }

    const data: ConfirmDialogData = {
      titleKey: 'workRequests.detail.rejectTitle',
      bodyKey: 'workRequests.detail.rejectBody',
      bodyParams: { number: request.requestNumber },
      confirmKey: 'workRequests.detail.rejectConfirm',
      tone: 'danger',
    };

    this.dialog
      .open<boolean, ConfirmDialogData>(ConfirmDialog, { data })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.doReject(request.id);
        }
      });
  }

  private doReject(id: string): void {
    this.api
      .reject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.resource.set(updated);
          this.toast.success('workRequests.detail.rejected');
        },
        error: () => this.toast.danger('common.errorGeneric'),
      });
  }

  protected back(): void {
    void this.router.navigate(['/app/work-requests']);
  }

  protected t(key: string): string {
    return this.translation.translate(key);
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.translation.locale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  }
}
