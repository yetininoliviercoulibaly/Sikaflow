export interface RequestMagicLinkDto {
  phoneNumber: string;
}

export interface VerifyMagicLinkDto {
  token: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: string;
  phoneNumber: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'GUEST';
}
