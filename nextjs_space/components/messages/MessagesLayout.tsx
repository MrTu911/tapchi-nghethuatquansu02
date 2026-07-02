'use client';

import { useState, useEffect } from 'react';
import { Loader2, MessagesSquare } from 'lucide-react';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatArea } from './ChatArea';
import { NewConversationDialog } from './NewConversationDialog';
import type { Conversation } from '@/hooks/messages/useConversations';

interface SessionUser {
  id: string;
  fullName: string;
  role: string;
}

export function MessagesLayout() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  // Trên mobile chỉ hiện được 1 cột: 'list' (danh sách) hoặc 'chat' (khu chat).
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setSession(data.data.user);
        }
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, []);

  const handleSelect = (conv: Conversation) => {
    setActiveConversation(conv);
    setMobileView('chat');
  };

  const handleLeft = (conversationId: string) => {
    setActiveConversation((prev) => (prev?.id === conversationId ? null : prev));
    setMobileView('list');
  };

  if (sessionLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.id) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground text-sm">
        Vui lòng đăng nhập để sử dụng chức năng tin nhắn.
      </div>
    );
  }

  return (
    <div className="theme-messages flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md ring-2 ring-accent/50">
            <MessagesSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Tin nhắn
              <span className="inline-block ml-2 h-1 w-8 rounded-full bg-accent align-middle" />
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trò chuyện với biên tập viên và đồng nghiệp
            </p>
          </div>
        </div>
        <NewConversationDialog
          currentUserId={session.id}
          currentUserRole={session.role}
        />
      </div>

      {/* Main panel */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border shadow-md bg-background">
        {/* Sidebar — mobile: ẩn khi đang xem chat; desktop: luôn hiện */}
        <div
          className={`${
            mobileView === 'chat' ? 'hidden' : 'block'
          } md:block w-full md:w-[300px] shrink-0 overflow-hidden`}
        >
          <ConversationSidebar
            currentUserId={session.id}
            currentUserRole={session.role}
            activeConversationId={activeConversation?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        {/* Chat area — mobile: ẩn khi đang xem danh sách; desktop: luôn hiện */}
        <div
          className={`${
            mobileView === 'list' ? 'hidden' : 'block'
          } md:block flex-1 overflow-hidden`}
        >
          <ChatArea
            conversation={activeConversation}
            currentUserId={session.id}
            onBack={() => setMobileView('list')}
            onLeft={handleLeft}
          />
        </div>
      </div>
    </div>
  );
}
