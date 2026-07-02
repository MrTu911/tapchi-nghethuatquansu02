'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from './useMessages';

interface SendMessagePayload {
  conversationId: string;
  content: string;
}

async function sendMessageApi(payload: SendMessagePayload): Promise<ChatMessage> {
  const res = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Không thể gửi tin nhắn');
  return data.data;
}

export function useSendMessage(conversationId: string, currentUserId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessageApi({ conversationId, content }),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ['messages', conversationId] });
      const previous = qc.getQueryData<ChatMessage[]>(['messages', conversationId]);

      // Optimistic message placeholder — id phải duy nhất để tránh trùng React key
      // khi gửi nhiều tin trong cùng một mili-giây.
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: { id: currentUserId, fullName: '', role: '' },
      };

      qc.setQueryData<ChatMessage[]>(['messages', conversationId], (old) =>
        old ? [...old, optimistic] : [optimistic]
      );

      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        qc.setQueryData(['messages', conversationId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
