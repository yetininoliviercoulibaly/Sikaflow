import api from '@/lib/api';

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  soldCount: number;
  isDefault: boolean;
  benefits: string[];
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  price: number;
  capacity: number;
  isDefault?: boolean;
  benefits?: string[];
}

export interface UpdateCategoryDto {
  name?: string;
  price?: number;
  capacity?: number;
  benefits?: string[];
}

export const CategoryService = {
  async listCategories(eventId: string): Promise<TicketCategory[]> {
    const response = await api.get<TicketCategory[]>(`/events/${eventId}/categories`);
    return response.data;
  },

  async createCategory(eventId: string, data: CreateCategoryDto): Promise<TicketCategory> {
    const response = await api.post<TicketCategory>(`/events/${eventId}/categories`, data);
    return response.data;
  },

  async updateCategory(eventId: string, categoryId: string, data: UpdateCategoryDto): Promise<void> {
    await api.put(`/events/${eventId}/categories/${categoryId}`, data);
  },

  async deleteCategory(eventId: string, categoryId: string): Promise<void> {
    await api.delete(`/events/${eventId}/categories/${categoryId}`);
  },

  async setDefaultCategory(eventId: string, categoryId: string): Promise<void> {
    await api.post(`/events/${eventId}/categories/${categoryId}/set-default`);
  },
};
