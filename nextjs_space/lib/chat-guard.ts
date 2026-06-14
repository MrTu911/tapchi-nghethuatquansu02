/**
 * Chat Permission Guard
 * Kiểm tra quyền chat giữa các vai trò trong hệ thống
 */

import { Role } from '@prisma/client';
import { getRoleLabelShort } from '@/lib/role-labels';

/**
 * Ma trận phân quyền chat (Role Matrix)
 * Định nghĩa vai trò nào có thể chat với vai trò nào
 */
export const CHAT_ROLE_MATRIX: Record<Role, Role[]> = {
  // Reader không có chat nội bộ
  READER: [],

  // Author có thể chat với: Section Editor, Managing Editor, Phó TBT, Chief Editor (EIC), Author khác
  // ❌ KHÔNG được chat với Reviewer (blind review)
  AUTHOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'AUTHOR', 'LAYOUT_EDITOR'],

  // Section Editor có thể chat với: Author, Reviewer, Managing Editor, Phó TBT, Chief Editor
  SECTION_EDITOR: ['AUTHOR', 'REVIEWER', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'SECTION_EDITOR', 'LAYOUT_EDITOR'],

  // Managing Editor có thể chat với tất cả (trừ Reader)
  MANAGING_EDITOR: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'MANAGING_EDITOR', 'LAYOUT_EDITOR'],

  // Reviewer có thể chat với: Section Editor, Managing Editor, Phó TBT, Chief Editor
  // ❌ KHÔNG được chat với Author (blind review)
  REVIEWER: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],

  // Phó Tổng biên tập (Deputy EIC) chat như EIC (trừ Reader)
  DEPUTY_EIC: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'DEPUTY_EIC', 'LAYOUT_EDITOR', 'COMMANDER'],

  // Chief Editor (EIC) có thể chat với tất cả
  EIC: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'SYSADMIN', 'EIC', 'LAYOUT_EDITOR', 'COMMANDER'],

  // Layout Editor có thể chat với editors
  LAYOUT_EDITOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'LAYOUT_EDITOR'],

  // System Admin có thể chat với tất cả
  SYSADMIN: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'LAYOUT_EDITOR', 'SECURITY_AUDITOR'],

  // Security Auditor có thể chat với admin
  SECURITY_AUDITOR: ['SYSADMIN', 'SECURITY_AUDITOR'],

  // Commander (Ban Chỉ huy) có thể chat với SYSADMIN, EIC, Phó TBT để nhận báo cáo
  COMMANDER: ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR', 'COMMANDER'],
};

/**
 * Kiểm tra xem một vai trò có thể chat với vai trò khác không
 * @param senderRole - Vai trò người gửi
 * @param receiverRole - Vai trò người nhận
 * @returns true nếu được phép chat, false nếu không
 */
export function canChat(senderRole: Role, receiverRole: Role): boolean {
  // Kiểm tra null/undefined
  if (!senderRole || !receiverRole) {
    console.warn('[chat-guard] canChat called with undefined role:', { senderRole, receiverRole });
    return false;
  }
  
  const allowedRoles = CHAT_ROLE_MATRIX[senderRole] || [];
  return allowedRoles.includes(receiverRole);
}

/**
 * Kiểm tra xem người dùng có thể tham gia hội thoại không
 * @param userRole - Vai trò người dùng
 * @param participantRoles - Danh sách vai trò của các thành viên trong hội thoại
 * @returns true nếu được phép tham gia, false nếu không
 */
export function canJoinConversation(userRole: Role, participantRoles: Role[]): boolean {
  const allowedRoles = CHAT_ROLE_MATRIX[userRole] || [];
  
  // Kiểm tra xem tất cả các thành viên trong hội thoại có nằm trong danh sách được phép không
  return participantRoles.every(role => allowedRoles.includes(role));
}

/**
 * Lấy danh sách vai trò mà người dùng có thể chat
 * @param userRole - Vai trò người dùng
 * @returns Danh sách vai trò được phép chat
 */
export function getAllowedRoles(userRole: Role): Role[] {
  if (!userRole) {
    console.warn('[chat-guard] getAllowedRoles called with undefined role');
    return [];
  }
  return CHAT_ROLE_MATRIX[userRole] || [];
}

export interface ChatPermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Trả về { allowed, reason } phù hợp với UI (tooltip, disable state)
 */
export function canSendMessageTo(senderRole: Role, receiverRole: Role): ChatPermission {
  if (!senderRole || !receiverRole) return { allowed: false, reason: 'Thiếu thông tin vai trò' };
  if (CHAT_ROLE_MATRIX[senderRole]?.length === 0) {
    return { allowed: false, reason: 'Vai trò của bạn không có quyền nhắn tin' };
  }
  const allowed = canChat(senderRole, receiverRole);
  if (!allowed) {
    const isBlindReview =
      (senderRole === 'AUTHOR' && receiverRole === 'REVIEWER') ||
      (senderRole === 'REVIEWER' && receiverRole === 'AUTHOR');
    return {
      allowed: false,
      reason: isBlindReview
        ? 'Không thể nhắn trực tiếp với Phản biện (chính sách blind review)'
        : 'Không có quyền nhắn tin với vai trò này',
    };
  }
  return { allowed: true };
}

// Nhãn vai trò dùng SSOT lib/role-labels.ts (tránh lệch nhãn giữa các file).
export function getRoleLabel(role: string): string {
  return getRoleLabelShort(role);
}

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    AUTHOR: 'bg-blue-100 text-blue-800',
    REVIEWER: 'bg-pink-100 text-pink-800',
    SECTION_EDITOR: 'bg-purple-100 text-purple-800',
    LAYOUT_EDITOR: 'bg-indigo-100 text-indigo-800',
    MANAGING_EDITOR: 'bg-orange-100 text-orange-800',
    SECURITY_AUDITOR: 'bg-yellow-100 text-yellow-800',
    DEPUTY_EIC: 'bg-rose-100 text-rose-800',
    EIC: 'bg-red-100 text-red-800',
    SYSADMIN: 'bg-gray-100 text-gray-800',
    READER: 'bg-slate-100 text-slate-600',
    COMMANDER: 'bg-emerald-100 text-emerald-800',
  };
  return map[role] ?? 'bg-gray-100 text-gray-800';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Validate conversation participants theo quy tắc blind review
 * @param participants - Danh sách vai trò của các thành viên
 * @returns { valid: boolean, reason?: string }
 */
export function validateConversationParticipants(
  participants: Role[]
): { valid: boolean; reason?: string } {
  // Kiểm tra nếu có cả Author và Reviewer trong cùng một hội thoại
  const hasAuthor = participants.includes('AUTHOR');
  const hasReviewer = participants.includes('REVIEWER');
  
  if (hasAuthor && hasReviewer) {
    return {
      valid: false,
      reason: 'Tác giả và phản biện không được phép trò chuyện trực tiếp (blind review policy)'
    };
  }
  
  // Kiểm tra từng cặp thành viên
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      if (!canChat(participants[i], participants[j])) {
        return {
          valid: false,
          reason: `${participants[i]} không có quyền chat với ${participants[j]}`
        };
      }
    }
  }
  
  return { valid: true };
}
