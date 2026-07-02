'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ConversationParticipant {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  type: 'private' | 'group' | 'system';
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages: LastMessage[];
  unreadCount?: number;
}

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/chat/conversations');
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Không thể tải hội thoại');
  return Array.isArray(data.data) ? data.data : [];
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 8000,
    staleTime: 4000,
  });
}

export function useInvalidateConversations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['conversations'] });
  };
}
