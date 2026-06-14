'use client';

import { useState, useEffect } from 'react';

export interface SearchUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  org?: string;
}

export function useUserSearch(
  query: string,
  excludeIds: string[] = [],
  roleFilter: string = ''
) {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // Debounce only when actively typing; load immediately on open (empty query)
    const delay = query.trim().length >= 2 ? 250 : 0;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (roleFilter) params.set('role', roleFilter);

        const res = await fetch(`/api/users/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data.filter((u: SearchUser) => !excludeIds.includes(u.id)));
        } else {
          setUsers([]);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setError('Không thể tải danh sách người dùng');
        }
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, excludeIds.join(',')]);

  return { users, isLoading, error };
}
