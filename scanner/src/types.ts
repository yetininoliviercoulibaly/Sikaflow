export interface ValidateTicketResponse {
  valid: boolean;
  status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID_SIGNATURE' | 'NOT_FOUND';
  ticketId?: string;
  eventName?: string;
  eventDate?: string;
  categoryName?: string;
  attendeePhone?: string | null;
  usedAt?: string;
  message: string;
}

export interface ScanResult {
  success: boolean;
  data?: ValidateTicketResponse;
  error?: string;
  timestamp: Date;
}
