import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Users } from 'lucide-react';
import { getInitials } from '@/lib/chat-guard';
import type { Conversation } from '@/hooks/messages/useConversations';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-orange-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function AvatarInitials({ name }: { name: string }) {
  const initials = getInitials(name);
  const gradient = getAvatarColor(name);
  return (
    <div
      className={`h-11 w-11 rounded-full bg-gradient-to-br ${gradient} text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white/70 dark:ring-black/20`}
    >
      {initials}
    </div>
  );
}

export function ConversationItem({ conversation, currentUserId, isActive, onClick }: Props) {
  const otherParticipants = conversation.participants.filter(
    (p) => p.user.id !== currentUserId
  );
  const displayName =
    conversation.title ??
    (otherParticipants.length > 0
      ? otherParticipants.map((p) => p.user.fullName).join(', ')
      : 'Hội thoại');
  const avatarName =
    conversation.type === 'group' || otherParticipants.length > 1
      ? displayName
      : (otherParticipants[0]?.user.fullName ?? displayName);

  const lastMsg = conversation.messages?.[0];
  const lastMsgPreview = lastMsg
    ? `${lastMsg.sender?.id === currentUserId ? 'Bạn: ' : ''}${lastMsg.content}`
    : null;

  const unread = conversation.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left pl-4 pr-3 py-2.5 rounded-xl flex gap-3 items-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 group ${
        isActive
          ? 'bg-primary/10 shadow-sm'
          : 'hover:bg-muted/60'
      }`}
    >
      {/* Thanh nhấn vàng đồng khi đang chọn */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-accent" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        {conversation.type === 'group' ? (
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm ring-2 ring-white/70 dark:ring-black/20">
            <Users className="h-5 w-5 text-white" />
          </div>
        ) : (
          <AvatarInitials name={avatarName} />
        )}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <span className="text-[9px] text-white font-bold leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
            {displayName}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.updatedAt), {
              addSuffix: false,
              locale: vi,
            })}
          </span>
        </div>

        {lastMsgPreview ? (
          <div className="flex items-center gap-1.5">
            <p className={`text-xs truncate flex-1 ${unread > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
              {lastMsgPreview}
            </p>
            {unread > 0 && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">Chưa có tin nhắn</p>
        )}
      </div>
    </button>
  );
}
