'use client';

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { EmptyConversationState } from './EmptyConversationState';
import { useMessages } from '@/hooks/messages/useMessages';
import { useSendMessage } from '@/hooks/messages/useSendMessage';
import { useMarkRead } from '@/hooks/messages/useMarkRead';
import type { Conversation } from '@/hooks/messages/useConversations';

interface Props {
  conversation: Conversation | null;
  currentUserId: string;
  onBack?: () => void;
  onLeft?: (conversationId: string) => void;
}

export function ChatArea({ conversation, currentUserId, onBack, onLeft }: Props) {
  const [inputValue, setInputValue] = useState('');

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useMessages(conversation?.id ?? null);

  const sendMutation = useSendMessage(conversation?.id ?? '', currentUserId);
  const markRead = useMarkRead();

  // Đánh dấu đã đọc khi mở hội thoại và khi có tin mới trong lúc đang mở.
  // Chỉ gọi khi thực sự còn tin chưa đọc từ người khác để tránh gọi thừa.
  const lastMarkedRef = useRef<string>('');
  const conversationId = conversation?.id ?? null;
  const messagesSignature = `${conversationId}:${messages.length}`;

  useEffect(() => {
    if (!conversationId) return;
    if (lastMarkedRef.current === messagesSignature) return;
    lastMarkedRef.current = messagesSignature;
    const hasUnreadFromOthers = messages.some(
      (m) => m.sender.id !== currentUserId && !m.isRead
    );
    if (hasUnreadFromOthers) {
      markRead.mutate(conversationId);
    }
    // markRead giữ ổn định theo react-query nên không đưa vào deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messagesSignature, currentUserId]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !conversation) return;
    setInputValue('');
    try {
      await sendMutation.mutateAsync(trimmed);
    } catch {
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setInputValue(trimmed);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full">
        <EmptyConversationState />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-background to-muted/10">
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={onBack}
        onLeft={onLeft}
      />

      <ScrollArea className="flex-1">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </ScrollArea>

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isSending={sendMutation.isPending}
      />
    </div>
  );
}
