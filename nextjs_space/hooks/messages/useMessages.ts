'use client';

import { useQuery } from '@tanstack/react-query';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
  if (!res.ok) throw new Error(`Không thể tải tin nhắn (${res.status})`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Không thể tải tin nhắn');
  return Array.isArray(data.data) ? data.data : [];
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}
