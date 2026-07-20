import { AuthSession, User, UserRole } from '@core/models';

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

export function mapUserFromDto(dto: UserDto): User {
  return { ...dto };
}

export function mapAuthSessionFromDto(dto: LoginResponseDto): AuthSession {
  return { token: dto.token, user: mapUserFromDto(dto.user) };
}
