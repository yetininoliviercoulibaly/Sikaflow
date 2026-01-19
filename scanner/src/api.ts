import axios from 'axios';
import type { ValidateTicketResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ScannerService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async validateTicket(hash: string): Promise<ValidateTicketResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await axios.post<ValidateTicketResponse>(
      `${API_BASE_URL}/api/v1/tickets/validate`,
      { hash, markAsUsed: true },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async verifyMagicToken(token: string): Promise<string> {
    const response = await axios.get(`${API_BASE_URL}/auth/verify?token=${token}`);
    if (response.data && response.data.accessToken) {
      this.setToken(response.data.accessToken);
      return response.data.accessToken;
    }
    throw new Error('Token invalide');
  }
}

export const scannerService = new ScannerService();
