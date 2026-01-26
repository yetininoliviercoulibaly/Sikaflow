
import api from '@/lib/api';
import { Event, EventStats, CreateEventDto } from '../types';

export const EventService = {
  async listEvents(): Promise<Event[]> {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  async createEvent(data: CreateEventDto): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async getEventStats(eventId: string): Promise<EventStats> {
    const response = await api.get<EventStats>(`/events/${eventId}/stats`);
    return response.data;
  }
};
