'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tin nhắn</h1>
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
        {/* Sidebar */}
        <div className="w-[300px] shrink-0 hidden md:block overflow-hidden">
          <ConversationSidebar
            currentUserId={session.id}
            currentUserRole={session.role}
            activeConversationId={activeConversation?.id ?? null}
            onSelect={(conv) => setActiveConversation(conv)}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatArea conversation={activeConversation} currentUserId={session.id} />
        </div>
      </div>
    </div>
  );
}
