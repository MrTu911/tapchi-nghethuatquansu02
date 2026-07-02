'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Info, ChevronLeft, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  onBack?: () => void;
  onLeft?: (conversationId: string) => void;
}

export function ChatHeader({ conversation, currentUserId, onBack, onLeft }: Props) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  const avatarGradient = other ? getAvatarColor(other.fullName) : 'from-primary to-primary/70';

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversation.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Không thể rời hội thoại');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Đã rời khỏi hội thoại');
      setConfirmOpen(false);
      setPopoverOpen(false);
      onLeft?.(conversation.id);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể rời hội thoại');
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 bg-background/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Nút quay lại (mobile) */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden -ml-1 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors shrink-0"
              aria-label="Quay lại danh sách"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Avatar */}
          {isPrivate && other ? (
            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient} text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm ring-2 ring-accent/30`}>
              {getInitials(other.fullName)}
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-accent/30">
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

        {/* Nút thông tin hội thoại */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-primary hover:bg-accent/20 rounded-lg p-1.5 transition-colors shrink-0"
              aria-label="Thông tin cuộc trò chuyện"
            >
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
            <div className="px-4 py-3 bg-primary/5 border-b">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {conversation.participants.length} thành viên ·{' '}
                {conversation.type === 'group' ? 'Nhóm' : 'Riêng tư'}
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto py-1.5">
              {conversation.participants.map((p) => (
                <div key={p.user.id} className="flex items-center gap-2.5 px-4 py-2">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(p.user.fullName)} text-white text-[11px] font-semibold flex items-center justify-center shrink-0`}>
                    {getInitials(p.user.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">
                      {p.user.fullName}
                      {p.user.id === currentUserId && (
                        <span className="text-muted-foreground font-normal"> (Bạn)</span>
                      )}
                    </p>
                    <Badge className={`text-[9px] px-1 py-0 mt-0.5 ${getRoleBadgeClass(p.user.role)}`}>
                      {getRoleLabel(p.user.role)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Rời khỏi hội thoại
            </button>
          </PopoverContent>
        </Popover>
      </div>
      <Separator />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời khỏi hội thoại?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sẽ không nhận được tin nhắn mới từ hội thoại này nữa. Bạn có thể được thêm lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                leaveMutation.mutate();
              }}
              disabled={leaveMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Rời khỏi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
