import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LucideCheckCircle2, LucideMail, LucideXCircle } from '@lucide/angular';
import { AuthApi } from '@core/api/auth-api.service';
import { AccountRoleDto } from '@core/api/dto/auth.dto';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { UserRole } from '@core/models';
import { PasswordResetFlow } from '../password-reset-flow.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Reset step 1 — port of the legacy `FrgtPswdEmailPage` slide: identify which
 * account is being reset. Same live lookup as sign-in, because one address can
 * front several role accounts and each has its own password.
 */
@Component({
  selector: 'app-password-reset-request',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    LucideCheckCircle2,
    LucideMail,
    LucideXCircle,
  ],
  templateUrl: './request.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetRequest {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly flow = inject(PasswordResetFlow);

  /**
   * Sign-in links here with `?email=` when it has already identified a blocked
   * account, so the user isn't asked to retype an address the app knows. The
   * account itself is still re-resolved through the normal lookup — a query
   * param is user input, not a trusted claim about which account this is.
   */
  private readonly prefilledEmail =
    this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';

  protected readonly form = new FormGroup({
    email: new FormControl(this.prefilledEmail || this.flow.email(), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    role: new FormControl<UserRole | ''>(this.flow.role() ?? '', { nonNullable: true }),
  });

  protected readonly submitted = signal(false);

  /**
   * Step 1 is shared by both journeys, but "reset your password" is wrong copy
   * for someone activating a brand-new account who has never had one.
   */
  protected readonly titleKey = computed(() =>
    this.flow.intent() === 'activate'
      ? 'auth.reset.request.activateTitle'
      : 'auth.reset.request.title',
  );
  protected readonly subtitleKey = computed(() =>
    this.flow.intent() === 'activate'
      ? 'auth.reset.request.activateSubtitle'
      : 'auth.reset.request.subtitle',
  );

  private readonly emailValue = toSignal(
    this.form.controls.email.valueChanges.pipe(startWith(this.form.controls.email.value)),
    { initialValue: '' },
  );

  private readonly roleValue = toSignal(
    this.form.controls.role.valueChanges.pipe(startWith(this.form.controls.role.value)),
    { initialValue: '' as UserRole | '' },
  );

  private readonly lookup = toSignal(
    this.form.controls.email.valueChanges.pipe(
      // Seeded with the current value so a prefilled address resolves without
      // the user having to touch the field.
      startWith(this.form.controls.email.value),
      debounceTime(400),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((email) => {
        if (!EMAIL_PATTERN.test(email)) {
          return of<AccountRoleDto[] | null>(null);
        }
        return this.authApi
          .lookupAccounts(email)
          .pipe(catchError(() => of<AccountRoleDto[] | null>(null)));
      }),
      takeUntilDestroyed(),
    ),
    { initialValue: null },
  );

  protected readonly accounts = computed(() => this.lookup() ?? []);
  protected readonly emailLooksValid = computed(() => EMAIL_PATTERN.test(this.emailValue().trim()));
  protected readonly unknownEmail = computed(
    () => this.emailLooksValid() && this.lookup() !== null && this.accounts().length === 0,
  );
  protected readonly knownEmail = computed(() => this.accounts().length > 0);
  protected readonly needsRoleChoice = computed(() => this.accounts().length > 1);

  protected readonly selectedAccount = computed<AccountRoleDto | null>(() => {
    const list = this.accounts();
    if (list.length === 1) {
      return list[0] ?? null;
    }
    const role = this.roleValue();
    return list.find((account) => account.role === role) ?? null;
  });

  /**
   * A suspended account can't be recovered by resetting a password — the block
   * is on the account, not the credential — so the flow stops here for it.
   */
  protected readonly suspended = computed(() => this.selectedAccount()?.status === 'suspended');

  protected readonly canContinue = computed(
    () => this.selectedAccount() !== null && !this.suspended(),
  );

  constructor() {
    effect(() => {
      const list = this.accounts();
      untracked(() => {
        const current = this.form.controls.role.value;
        if (list.length === 1) {
          const only = list[0];
          if (only && current !== only.role) {
            this.form.controls.role.setValue(only.role);
          }
          return;
        }
        if (current !== '' && !list.some((account) => account.role === current)) {
          this.form.controls.role.setValue('');
        }
      });
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    const account = this.selectedAccount();
    if (!account || this.suspended()) {
      return;
    }

    this.flow.setIdentity(this.form.controls.email.value.trim(), account);
    void this.router.navigate(['../method'], { relativeTo: this.route });
  }
}
