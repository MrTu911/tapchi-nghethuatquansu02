'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

async function markReadApi(conversationId: string): Promise<void> {
  const res = await fetch(`/api/chat/conversations/${conversationId}/read`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Không thể đánh dấu đã đọc');
}

/**
 * Đánh dấu một hội thoại là đã đọc (tắt badge chưa đọc + cập nhật read receipt).
 * Idempotent — an toàn khi gọi lặp lại lúc mở hội thoại hoặc khi có tin mới.
 */
export function useMarkRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => markReadApi(conversationId),
    onSuccess: (_data, conversationId) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
