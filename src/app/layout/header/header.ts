import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideChevronDown,
  LucideFlag,
  LucideGlobe,
  LucideLifeBuoy,
  LucideLogOut,
  LucideMenu,
  LucideSearch,
  LucideShieldCheck,
  LucideUser,
} from '@lucide/angular';
import { TranslatePipe } from '@core/i18n/translate.pipe';
import { TranslationService } from '@core/i18n/translation.service';
import { SessionStore } from '@core/session/session-store.service';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog';
import { SidebarStateService } from '../sidebar-state.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    LucideBell,
    LucideChevronDown,
    LucideFlag,
    LucideGlobe,
    LucideLifeBuoy,
    LucideLogOut,
    LucideMenu,
    LucideSearch,
    LucideShieldCheck,
    LucideUser,
    TranslatePipe,
  ],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly session = inject(SessionStore);
  protected readonly i18n = inject(TranslationService);

  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly isMenuOpen = signal(false);
  protected readonly searchQuery = signal('');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleLocale(): void {
    this.i18n.toggleLocale();
  }

  protected onSearchSubmit(): void {
    const searchKey = this.searchQuery().trim();
    void this.router.navigate(['/app/requests'], searchKey ? { queryParams: { searchKey } } : {});
  }

  protected signOut(): void {
    this.closeMenu();
    this.dialogService
      .open<boolean>(ConfirmDialog, {
        data: {
          titleKey: 'header.signOutConfirmTitle',
          bodyKey: 'header.signOutConfirmBody',
          confirmKey: 'common.signOut',
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.session.clearSession();
          void this.router.navigateByUrl('/');
        }
      });
  }
}
