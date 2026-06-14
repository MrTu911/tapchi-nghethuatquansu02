'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SubmissionContextBanner } from './SubmissionContextBanner';
import { EmptyConversationState } from './EmptyConversationState';
import { useMessages } from '@/hooks/messages/useMessages';
import { useSendMessage } from '@/hooks/messages/useSendMessage';
import type { Conversation } from '@/hooks/messages/useConversations';

interface Props {
  conversation: Conversation | null;
  currentUserId: string;
}

export function ChatArea({ conversation, currentUserId }: Props) {
  const [inputValue, setInputValue] = useState('');

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useMessages(conversation?.id ?? null);

  const sendMutation = useSendMessage(conversation?.id ?? '', currentUserId);

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
      <ChatHeader conversation={conversation} currentUserId={currentUserId} />

      {conversation.submissionId && conversation.submissionCode && (
        <SubmissionContextBanner
          submissionId={conversation.submissionId}
          submissionCode={conversation.submissionCode}
          submissionTitle={conversation.submissionTitle}
          submissionStatus={conversation.submissionStatus}
        />
      )}

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
