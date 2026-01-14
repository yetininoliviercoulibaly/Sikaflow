import api from '@/lib/api';
import { AuthResponse, RequestMagicLinkDto } from '../types';

export const authService = {
  async requestMagicLink(data: RequestMagicLinkDto): Promise<void> {
    await api.post('/auth/magic-link', data);
  },

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await api.get<AuthResponse>(`/auth/verify?token=${token}`);
    return response.data;
  },
};
