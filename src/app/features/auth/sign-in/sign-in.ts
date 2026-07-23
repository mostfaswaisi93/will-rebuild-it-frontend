import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LucideCheckCircle2,
  LucideEye,
  LucideEyeOff,
  LucideMail,
  LucideXCircle,
} from '@lucide/angular';
import { AuthApi } from '@core/api/auth-api.service';
import { AccountRoleDto } from '@core/api/dto/auth.dto';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { UserRole } from '@core/models';
import { homeRouteForRole } from '@core/session/role-home';
import { SessionStore } from '@core/session/session-store.service';
import { ToastService } from '@core/toast/toast.service';

/** Mirrors the legacy `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` sign-in pattern. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Blocking account states — a password is never accepted for these. */
type AccountBlock = 'suspended' | 'inactive' | 'incompleteRegistration' | null;

/**
 * Sign-in — port of the legacy `NewLoginPageComponent`'s `loginPage` slide.
 *
 * The legacy page packed six screens into one component behind a `slideMode`
 * string driven by query params (login, forgot-password email, channel choice,
 * OTP, reset, activate). Each is now its own route under `/auth`, so the browser
 * back button, deep links and guards all behave; this file is only the first.
 *
 * The live email lookup is preserved: as soon as the address parses, the portal
 * resolves which role accounts sit behind it, so the role picker and any
 * account-status warning appear before the password is typed.
 */
@Component({
  selector: 'app-sign-in',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    LucideCheckCircle2,
    LucideEye,
    LucideEyeOff,
    LucideMail,
    LucideXCircle,
  ],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Registration hands the new address over so it isn't retyped here. */
  private readonly queryParams = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly prefilledEmail = this.queryParams.get('email') ?? '';
  /** Where `authGuard` bounced the visitor from, so sign-in can hand them back. */
  private readonly returnUrl = this.queryParams.get('returnUrl');

  protected readonly form = new FormGroup({
    email: new FormControl(this.prefilledEmail.trim(), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    // Legacy enforced a 6-character minimum at sign-in even though its reset
    // rules demand 8 — kept, so accounts created under the old rules still work.
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    role: new FormControl<UserRole | ''>('', { nonNullable: true }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  private readonly emailValue = toSignal(
    this.form.controls.email.valueChanges.pipe(startWith(this.form.controls.email.value)),
    { initialValue: '' },
  );

  private readonly roleValue = toSignal(
    this.form.controls.role.valueChanges.pipe(startWith(this.form.controls.role.value)),
    { initialValue: '' as UserRole | '' },
  );

  /** null while the address is unparseable, in flight, or the lookup failed. */
  private readonly lookup = toSignal(
    this.form.controls.email.valueChanges.pipe(
      startWith(this.form.controls.email.value),
      debounceTime(400),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((email) => {
        if (!EMAIL_PATTERN.test(email)) {
          return of<AccountRoleDto[] | null>(null);
        }
        return this.authApi.lookupAccounts(email).pipe(
          // A failed lookup must not present as "no such user" — that would tell
          // someone their account is gone when the network merely blipped.
          catchError(() => of<AccountRoleDto[] | null>(null)),
        );
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

  /** The account the password will be checked against. */
  protected readonly selectedAccount = computed<AccountRoleDto | null>(() => {
    const list = this.accounts();
    if (list.length === 1) {
      return list[0] ?? null;
    }
    const role = this.roleValue();
    return list.find((account) => account.role === role) ?? null;
  });

  protected readonly block = computed<AccountBlock>(() => {
    const account = this.selectedAccount();
    if (!account) {
      return null;
    }
    if (account.status === 'suspended') {
      return 'suspended';
    }
    if (!account.registrationComplete) {
      return 'incompleteRegistration';
    }
    if (account.status === 'inactive') {
      return 'inactive';
    }
    return null;
  });

  protected readonly canSubmit = computed(
    () => this.knownEmail() && this.block() === null && !this.submitting(),
  );

  constructor() {
    // Keep the role control in step with the resolved accounts: a single-account
    // email has nothing to choose, and a changed address must not keep the role
    // picked for the previous one.
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

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected submit(): void {
    this.submitted.set(true);

    const account = this.selectedAccount();
    if (!account || this.block() !== null) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);

    this.authApi
      .login(email.trim(), password, account.role)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.submitting.set(false);
          this.session.setSession(session);
          this.routeAfterLogin(session.user.role);
        },
        error: () => {
          this.submitting.set(false);
          this.toast.danger('auth.signIn.invalidCredentials');
        },
      });
  }

  /**
   * All seven roles are served by this app, so every role lands in the shell at
   * its own home (`homeRouteForRole`). Beneficiaries and donors used to be
   * ejected to a separate customer origin; that predates their in-app
   * experience (dashboard, requests, projects, teams, funding, reviews,
   * donations) and contradicted `homeRouteForRole`, `roleGuard` and the
   * sidebar, which all route them here.
   */
  private routeAfterLogin(role: UserRole): void {
    // Hand the visitor back to whatever `authGuard` bounced them from. Only
    // in-app paths are honoured, so a crafted `returnUrl` cannot bounce someone
    // to another origin after they authenticate.
    if (this.returnUrl?.startsWith('/app/')) {
      void this.router.navigateByUrl(this.returnUrl);
      return;
    }
    void this.router.navigate(['/app', homeRouteForRole(role)]);
  }
}
