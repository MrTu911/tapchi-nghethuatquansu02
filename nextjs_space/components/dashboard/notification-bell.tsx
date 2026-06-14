'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationPanel } from './notification-panel';
import { Badge } from '@/components/ui/badge';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/notifications/stream');
    eventSourceRef.current = es;

    es.addEventListener('unread-count', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setUnreadCount(data.count ?? 0);
      } catch {
        // ignore parse error
      }
    });

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notification = JSON.parse(e.data);
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
          action: notification.link
            ? { label: 'Xem', onClick: () => window.location.href = notification.link }
            : undefined,
        });
      } catch {
        // ignore parse error
      }
    });

    es.onerror = () => {
      es.close();
      // Reconnect sau 30s khi bị ngắt kết nối
      reconnectTimerRef.current = setTimeout(() => {
        connectSSE();
      }, 30_000);
    };
  }, []);

  useEffect(() => {
    connectSSE();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connectSSE]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <NotificationPanel onCountChange={setUnreadCount} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
