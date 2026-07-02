import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRoleLabel, getRoleBadgeClass, getInitials } from '@/lib/chat-guard';
import type { ChatMessage } from '@/hooks/messages/useMessages';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  showSenderInfo: boolean;
}

function formatTime(dateStr: string) {
  try {
    return format(new Date(dateStr), 'HH:mm', { locale: vi });
  } catch {
    return '';
  }
}

export function MessageBubble({ message, isOwn, showSenderInfo }: Props) {
  const isOptimistic = message.id.startsWith('optimistic-');
  const avatarGradient = getAvatarColor(message.sender.fullName || '');

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 shrink-0 flex items-end pb-5">
          {showSenderInfo ? (
            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarGradient} text-white text-xs font-semibold flex items-center justify-center shadow-sm`}>
              {getInitials(message.sender.fullName || '?')}
            </div>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      )}

      <div className={`max-w-[68%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender info */}
        {!isOwn && showSenderInfo && (
          <div className="flex items-center gap-2 mb-1.5 ml-1">
            <span className="text-xs font-semibold text-foreground/80">
              {message.sender.fullName}
            </span>
            {message.sender.role && (
              <Badge
                className={`text-[10px] px-1.5 py-0 ${getRoleBadgeClass(message.sender.role)}`}
              >
                {getRoleLabel(message.sender.role)}
              </Badge>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
            isOwn
              ? `rounded-2xl rounded-br-md bg-primary text-primary-foreground ${isOptimistic ? 'opacity-50' : ''}`
              : 'rounded-2xl rounded-bl-md bg-white dark:bg-muted border border-border/60 text-foreground'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp + read receipt */}
        <div
          className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          {isOwn && !isOptimistic && (
            <span title={message.isRead ? 'Đã xem' : 'Đã gửi'}>
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Check className="h-3.5 w-3.5 text-muted-foreground/70" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Own avatar spacer */}
      {isOwn && <div className="w-8 shrink-0" />}
    </div>
  );
}
