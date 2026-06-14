'use client';

import { useEffect, useRef } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '@/hooks/messages/useMessages';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Hôm nay';
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, 'EEEE, dd/MM/yyyy', { locale: vi });
}

export function MessageList({ messages, currentUserId, isLoading, error, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        <p className="text-xs text-muted-foreground">Đang tải tin nhắn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-destructive font-medium">Không thể tải tin nhắn</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="text-xs">
          Thử lại
        </Button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground select-none">
        <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-3 shadow-inner">
          <MessageSquare className="h-7 w-7 opacity-30" />
        </div>
        <p className="text-sm font-medium text-foreground/50">Chưa có tin nhắn nào</p>
        <p className="text-xs mt-1 text-muted-foreground/60">Hãy bắt đầu cuộc trò chuyện</p>
      </div>
    );
  }

  let lastDate: Date | null = null;

  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      {messages.map((msg, idx) => {
        const msgDate = new Date(msg.createdAt);
        const showDayDivider = !lastDate || !isSameDay(msgDate, lastDate);
        lastDate = msgDate;

        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showSenderInfo =
          msg.sender.id !== currentUserId &&
          (prevMsg === null || prevMsg.sender.id !== msg.sender.id || showDayDivider);

        return (
          <div key={msg.id}>
            {showDayDivider && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[11px] text-muted-foreground bg-background px-3 py-1 rounded-full border border-border/40 font-medium">
                  {getDayLabel(msg.createdAt)}
                </span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
            )}
            <MessageBubble
              message={msg}
              isOwn={msg.sender.id === currentUserId}
              showSenderInfo={showSenderInfo}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
