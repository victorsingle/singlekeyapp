import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channel: string[];
  read: boolean;
  read_at?: string | null;
  created_at: string;
  sent_at?: string | null;
}

interface NotificationStore {
  notifications: Notification[];
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  fetchNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[❌ Erro ao buscar notificações]', error);
      return;
    }

    set({ notifications: data || [] });
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[❌ Erro ao marcar notificação como lida]', error);
      return;
    }

    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
    );
    set({ notifications: updated });
  },
  

  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  }
}));
