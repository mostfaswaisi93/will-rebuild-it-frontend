import { AccountStatus, AuthSession, User, UserRole } from '@core/models';

export interface UserDto {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserDto;
}

/**
 * One role account behind an email address. The legacy portal returned this as
 * `data[].rbac[0]` plus a scattering of sibling flags; flattening it here keeps
 * the branching in `sign-in` readable.
 */
export interface AccountRoleDto {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  /**
   * False for a contractor who signed up but never finished onboarding — the
   * legacy `vanlynkRegCompletedFlag`/`leadRegCompletedFlag` pair. Such an
   * account cannot sign in; it is sent back to the registration wizard.
   */
  registrationComplete: boolean;
}

export interface EmailLookupResponseDto {
  accounts: AccountRoleDto[];
}

export function mapUserFromDto(dto: UserDto): User {
  return { ...dto };
}

export function mapAuthSessionFromDto(dto: LoginResponseDto): AuthSession {
  return { token: dto.token, user: mapUserFromDto(dto.user) };
}
