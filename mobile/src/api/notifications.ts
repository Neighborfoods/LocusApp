import api from './client';
import { Notification } from '@/types/models';

export const notificationsApi = {
  list: async (page = 1, limit = 30): Promise<Notification[]> => {
    const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return data.data ?? [];
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data.data?.count ?? 0;
  },
};
