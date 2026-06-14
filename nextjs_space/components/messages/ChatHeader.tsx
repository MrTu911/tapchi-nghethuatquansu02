import { Users, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRoleLabel, getRoleBadgeClass, getInitials } from '@/lib/chat-guard';
import type { Conversation } from '@/hooks/messages/useConversations';

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
  conversation: Conversation;
  currentUserId: string;
}

export function ChatHeader({ conversation, currentUserId }: Props) {
  const otherParticipants = conversation.participants.filter(
    (p) => p.user.id !== currentUserId
  );
  const isPrivate = conversation.type === 'private' && otherParticipants.length === 1;
  const other = isPrivate ? otherParticipants[0]?.user : null;

  const displayName =
    conversation.title ??
    (otherParticipants.length > 0
      ? otherParticipants.map((p) => p.user.fullName).join(', ')
      : 'Hội thoại');

  const avatarGradient = other ? getAvatarColor(other.fullName) : 'from-slate-400 to-slate-600';

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-background/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {isPrivate && other ? (
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient} text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm`}>
              {getInitials(other.fullName)}
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              {isPrivate && other?.role && (
                <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeClass(other.role)}`}>
                  {getRoleLabel(other.role)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPrivate
                ? 'Tin nhắn riêng tư'
                : `${conversation.participants.length} thành viên`}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors shrink-0"
          aria-label="Thông tin cuộc trò chuyện"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      <Separator />
    </>
  );
}
