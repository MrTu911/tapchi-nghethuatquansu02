import type { Role } from '@/lib/rbac'

/**
 * SSOT (Single Source Of Truth) ánh xạ vai trò → dashboard mặc định — Tạp chí NTQS.
 *
 * Trước đây logic này bị lặp ở 3 nơi và dễ lệch nhau:
 *   - middleware.ts (roleDashboardMap)
 *   - app/dashboard/page.tsx (chuỗi if/else theo can.*)
 *   - app/auth/login/page.tsx (getRoleDashboard cục bộ)
 *
 * File này là module THUẦN (không import Prisma/Node API) nên dùng được ở cả
 * Edge middleware lẫn client component. READER dùng chung không gian Tác giả.
 */
export const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  SYSADMIN: '/dashboard/admin',
  EIC: '/dashboard/eic',
  DEPUTY_EIC: '/dashboard/deputy',
  MANAGING_EDITOR: '/dashboard/managing',
  SECTION_EDITOR: '/dashboard/editor',
  LAYOUT_EDITOR: '/dashboard/layout',
  SECURITY_AUDITOR: '/dashboard/security',
  REVIEWER: '/dashboard/reviewer',
  AUTHOR: '/dashboard/author',
  READER: '/dashboard/author',
  COMMANDER: '/dashboard/commander',
}

/** Dashboard mặc định cho một vai trò; fallback về khu vực Tác giả nếu không khớp. */
export function getRoleDashboard(role?: string | null): string {
  if (!role) return '/dashboard/author'
  return ROLE_DASHBOARD_MAP[role as Role] ?? '/dashboard/author'
}
