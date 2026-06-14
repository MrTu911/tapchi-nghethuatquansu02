'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Lock, Check, Loader2, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  canSendMessageTo,
  getRoleLabel,
  getRoleBadgeClass,
  getInitials,
  CHAT_ROLE_MATRIX,
} from '@/lib/chat-guard';
import { useUserSearch, type SearchUser } from '@/hooks/messages/useUserSearch';
import { useInvalidateConversations } from '@/hooks/messages/useConversations';
import { Role } from '@prisma/client';

interface Props {
  currentUserId: string;
  currentUserRole: string;
}

// Highlight matched text in search results
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function UserCard({
  user,
  isSelected,
  query,
  onSelect,
}: {
  user: SearchUser;
  isSelected: boolean;
  query: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      }`}
    >
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0 select-none">
        {getInitials(user.fullName)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          <HighlightMatch text={user.fullName} query={query} />
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          <HighlightMatch text={user.email} query={query} />
        </p>
        {user.org && (
          <p className="text-xs text-muted-foreground truncate">
            <HighlightMatch text={user.org} query={query} />
          </p>
        )}
      </div>

      {/* Role + checkmark */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Badge className={`text-[10px] px-1.5 py-0 ${getRoleBadgeClass(user.role)}`}>
          {getRoleLabel(user.role)}
        </Badge>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
    </button>
  );
}

function BlockedUserCard({ user, reason }: { user: SearchUser; reason: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20 opacity-50 cursor-not-allowed">
            <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{user.fullName}</p>
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeClass(user.role)}`}>
              {getRoleLabel(user.role)}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-center">
          <p className="text-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RoleFilterBar({
  currentRole,
  activeFilter,
  onFilter,
}: {
  currentRole: string;
  activeFilter: string;
  onFilter: (role: string) => void;
}) {
  const allowedRoles = CHAT_ROLE_MATRIX[currentRole as Role] ?? [];
  if (allowedRoles.length === 0) return null;

  // Group into unique labels
  const uniqueRoles = Array.from(new Set(allowedRoles));

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onFilter('')}
        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
          activeFilter === ''
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border hover:border-primary/40 hover:bg-muted/40'
        }`}
      >
        Tất cả
      </button>
      {uniqueRoles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onFilter(activeFilter === role ? '' : role)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            activeFilter === role
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:border-primary/40 hover:bg-muted/40'
          }`}
        >
          {getRoleLabel(role)}
        </button>
      ))}
    </div>
  );
}

export function NewConversationDialog({ currentUserId, currentUserRole }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const { users, isLoading } = useUserSearch(query, [currentUserId], roleFilter);
  const invalidate = useInvalidateConversations();

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId]
  );

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setQuery('');
      setRoleFilter('');
      setSelectedId('');
    }
  };

  const handleCreate = async () => {
    if (!selectedId) return;
    setCreating(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [selectedId], type: 'private' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã tạo cuộc trò chuyện');
        handleOpenChange(false);
        invalidate();
      } else {
        toast.error(data.error ?? 'Không thể tạo hội thoại');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setCreating(false);
    }
  };

  // Separate allowed vs blocked users
  const { allowed: allowedUsers, blocked: blockedUsers } = useMemo(() => {
    const allowed: SearchUser[] = [];
    const blocked: Array<SearchUser & { reason: string }> = [];
    for (const u of users) {
      const perm = canSendMessageTo(currentUserRole as Role, u.role as Role);
      if (perm.allowed) allowed.push(u);
      else blocked.push({ ...u, reason: perm.reason ?? 'Không có quyền' });
    }
    return { allowed, blocked };
  }, [users, currentUserRole]);

  const hasResults = users.length > 0;
  const isQueryActive = query.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Tin nhắn mới
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bắt đầu cuộc trò chuyện
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-3 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm theo tên, email hoặc tổ chức..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Role filter pills */}
          <RoleFilterBar
            currentRole={currentUserRole}
            activeFilter={roleFilter}
            onFilter={setRoleFilter}
          />
        </div>

        {/* Results list */}
        <ScrollArea className="h-72 border-t border-b">
          <div className="px-3 py-2 space-y-1">
            {isLoading ? (
              <div className="space-y-2 p-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 items-center px-1 py-1.5">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !hasResults ? (
              <div className="py-10 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  {isQueryActive ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng nào'}
                </p>
                {isQueryActive && (
                  <p className="text-xs mt-1">Thử tìm theo tên hoặc email khác</p>
                )}
              </div>
            ) : (
              <>
                {/* Section label when not searching */}
                {!isQueryActive && (
                  <p className="text-xs text-muted-foreground px-1 py-1.5 font-medium">
                    Người dùng có thể nhắn ({allowedUsers.length})
                  </p>
                )}

                {/* Allowed users */}
                {allowedUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedId === user.id}
                    query={query}
                    onSelect={() =>
                      setSelectedId(selectedId === user.id ? '' : user.id)
                    }
                  />
                ))}

                {/* Blocked users section */}
                {blockedUsers.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground px-1 pt-3 pb-1 font-medium">
                      Không thể nhắn trực tiếp
                    </p>
                    {blockedUsers.map((user) => (
                      <BlockedUserCard key={user.id} user={user} reason={user.reason} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3">
          {selectedUser ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                  {getInitials(selectedUser.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedUser.fullName}</p>
                </div>
                <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeClass(selectedUser.role)}`}>
                  {getRoleLabel(selectedUser.role)}
                </Badge>
              </div>
              <Button onClick={handleCreate} disabled={creating} size="sm">
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Bắt đầu
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Chọn một người để bắt đầu trò chuyện
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
