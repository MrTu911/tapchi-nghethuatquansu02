'use client';

import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, MessageSquare, FileText } from 'lucide-react';
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

function ConversationList({
  currentUserId,
  activeConversationId,
  onSelect,
  tab,
}: {
  currentUserId: string;
  activeConversationId: string | null;
  onSelect: (conv: Conversation) => void;
  tab: 'chat' | 'submission';
}) {
  const [search, setSearch] = useState('');
  const { data = [], isLoading, error, refetch } = useConversations(tab);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((c) => {
      const nameMatch = (c.title ?? '')
        .toLowerCase()
        .includes(q) ||
        c.participants.some((p) => p.user.fullName.toLowerCase().includes(q));
      const codeMatch = c.submissionCode?.toLowerCase().includes(q) ?? false;
      return nameMatch || codeMatch;
    });
  }, [data, search]);

  return (
    <div className="flex flex-col h-full">
      <ConversationSearch
        value={search}
        onChange={setSearch}
        placeholder={tab === 'submission' ? 'Tìm bài nộp...' : 'Tìm hội thoại...'}
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
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              {tab === 'submission' ? (
                <FileText className="h-6 w-6 opacity-40" />
              ) : (
                <MessageSquare className="h-6 w-6 opacity-40" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground/60">
              {search ? 'Không tìm thấy kết quả' : tab === 'submission' ? 'Chưa có trao đổi bài nộp' : 'Chưa có hội thoại nào'}
            </p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              {!search && (tab === 'submission' ? 'Các cuộc trao đổi về bài gửi sẽ hiện ở đây' : 'Tạo cuộc trò chuyện mới để bắt đầu')}
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

export function ConversationSidebar({
  currentUserId,
  activeConversationId,
  onSelect,
}: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'submission'>('chat');

  return (
    <div className="flex flex-col h-full overflow-hidden border-r bg-muted/20">
      {/* Tab header */}
      <div className="flex shrink-0 border-b bg-background/80">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'chat'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Hội thoại
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submission')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'submission'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Bài gửi
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ConversationList
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onSelect={onSelect}
            tab="chat"
          />
        )}
        {activeTab === 'submission' && (
          <ConversationList
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onSelect={onSelect}
            tab="submission"
          />
        )}
      </div>
    </div>
  );
}
