'use client';

import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import { ConversationSearch } from './ConversationSearch';
import { useConversations } from '@/hooks/messages/useConversations';
import type { Conversation } from '@/hooks/messages/useConversations';

interface Props {
  currentUserId: string;
  currentUserRole: string;
  activeConversationId: string | null;
  onSelect: (conv: Conversation) => void;
}

export function ConversationSidebar({
  currentUserId,
  activeConversationId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const { data = [], isLoading, error, refetch } = useConversations();

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        (c.title ?? '').toLowerCase().includes(q) ||
        c.participants.some((p) => p.user.fullName.toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalUnread = useMemo(
    () => data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [data]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden border-r bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b bg-background/80">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Hội thoại</span>
        </div>
        {totalUnread > 0 && (
          <span className="text-[11px] font-semibold text-primary bg-accent/25 border border-accent/40 rounded-full px-2 py-0.5">
            {totalUnread > 99 ? '99+' : totalUnread} chưa đọc
          </span>
        )}
      </div>

      <ConversationSearch
        value={search}
        onChange={setSearch}
        placeholder="Tìm hội thoại..."
      />

      {error && (
        <div className="p-4 text-center">
          <p className="text-xs text-destructive mb-2">Không tải được hội thoại</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Thử lại
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-foreground/60">
              {search ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại nào'}
            </p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              {!search && 'Tạo cuộc trò chuyện mới để bắt đầu'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={currentUserId}
                isActive={activeConversationId === conv.id}
                onClick={() => onSelect(conv)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
