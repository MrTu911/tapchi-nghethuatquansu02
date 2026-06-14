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
  submissionId?: string | null;
  submissionCode?: string | null;
  submissionStatus?: string | null;
  submissionTitle?: string | null;
}

async function fetchConversations(tab: 'chat' | 'submission'): Promise<Conversation[]> {
  const res = await fetch(`/api/chat/conversations?tab=${tab}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Không thể tải hội thoại');
  return Array.isArray(data.data) ? data.data : [];
}

export function useConversations(tab: 'chat' | 'submission' = 'chat') {
  return useQuery({
    queryKey: ['conversations', tab],
    queryFn: () => fetchConversations(tab),
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
