
export type Role =
  | "READER"
  | "AUTHOR"
  | "REVIEWER"
  | "SECTION_EDITOR"
  | "MANAGING_EDITOR"
  | "DEPUTY_EIC"
  | "EIC"
  | "LAYOUT_EDITOR"
  | "SYSADMIN"
  | "SECURITY_AUDITOR"
  | "COMMANDER"

/**
 * Vai trò đủ điều kiện được gán làm phản biện cho một bài nộp.
 *
 * Trong nghiệp vụ NTQS, ngoài phản biện viên độc lập (REVIEWER), các biên tập viên
 * (chuyên mục / thư ký tòa soạn / tổng biên tập) cũng có thể trực tiếp phản biện
 * (can.review = true). Hằng số này là SSOT để TRANG chọn phản biện và API gán
 * phản biện luôn dùng CÙNG một danh sách — tránh lệch (UI mời người mà API từ chối).
 *
 * Lưu ý: tác giả của bài vẫn bị loại trừ riêng (conflict of interest) ở tầng API.
 */
export const REVIEWER_ELIGIBLE_ROLES: Role[] = [
  'REVIEWER',
  'SECTION_EDITOR',
  'MANAGING_EDITOR',
  'DEPUTY_EIC',
  'EIC',
]

export const roleHierarchy: Record<Role, number> = {
  READER: 1,
  AUTHOR: 2,
  REVIEWER: 3,
  SECTION_EDITOR: 4,
  LAYOUT_EDITOR: 4,
  MANAGING_EDITOR: 5,
  SECURITY_AUDITOR: 5,
  // Phó Tổng biên tập: trên Thư ký tòa soạn, dưới Tổng biên tập
  DEPUTY_EIC: 6,
  EIC: 7,
  COMMANDER: 8,
  SYSADMIN: 9
}

export const can = {
  // Quyền đọc và xem nội dung công khai
  read: (role?: Role) => true,

  // Quyền nộp bài
  submit: (role?: Role) => !!role && (
    role === "AUTHOR" || roleHierarchy[role] >= roleHierarchy["AUTHOR"]
  ),

  // Quyền gán phản biện
  assignReview: (role?: Role) => role === "SECTION_EDITOR" ||
    role === "MANAGING_EDITOR" ||
    role === "DEPUTY_EIC" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền phản biện
  review: (role?: Role) => role === "REVIEWER" ||
    (role && roleHierarchy[role] >= roleHierarchy["REVIEWER"]),

  // Quyền đưa ra quyết định biên tập
  decide: (role?: Role) => role === "SECTION_EDITOR" ||
    role === "MANAGING_EDITOR" ||
    role === "DEPUTY_EIC" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền dàn trang
  layout: (role?: Role) => role === "LAYOUT_EDITOR" ||
    role === "MANAGING_EDITOR" ||
    role === "DEPUTY_EIC" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền xuất bản — chỉ Tổng biên tập ký cuối (Phó TBT KHÔNG có quyền này)
  publish: (role?: Role) => role === "EIC" || role === "SYSADMIN",

  // Quyền quản trị nội dung/CMS — Phó TBT ngang Tổng biên tập
  admin: (role?: Role) => role === "SYSADMIN" || role === "EIC" || role === "DEPUTY_EIC" || role === "MANAGING_EDITOR",

  // Quyền xem dashboard chỉ huy — read-only executive view
  commander: (role?: Role) => role === "COMMANDER" || role === "SYSADMIN",

  // Quyền kiểm định bảo mật
  securityAudit: (role?: Role) => role === "SECURITY_AUDITOR" ||
    role === "DEPUTY_EIC" ||
    role === "EIC" ||
    role === "SYSADMIN",

  // Quyền xem dashboard theo vai trò
  accessDashboard: (role?: Role, targetRole?: string) => {
    if (!role || !targetRole) return false

    switch (targetRole) {
      case 'author':
        return can.submit(role)
      case 'reviewer':
        return can.review(role)
      case 'editor':
        return can.decide(role)
      case 'managing':
        return role === "MANAGING_EDITOR" || role === "DEPUTY_EIC" || role === "EIC" || role === "SYSADMIN"
      case 'deputy':
        return role === "DEPUTY_EIC" || role === "EIC" || role === "SYSADMIN"
      case 'eic':
        // Phó TBT được xem dashboard giám sát của Tổng biên tập (read), nhưng publish vẫn EIC-only
        return role === "DEPUTY_EIC" || role === "EIC" || role === "SYSADMIN"
      case 'commander':
        return can.commander(role)
      case 'admin':
        return can.admin(role)
      default:
        return false
    }
  }
}

export function hasRole(userRole?: Role, requiredRoles?: Role[]): boolean {
  if (!userRole || !requiredRoles) return false
  return requiredRoles.includes(userRole)
}

export function hasMinimumRole(userRole?: Role, minimumRole?: Role): boolean {
  if (!userRole || !minimumRole) return false
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole]
}

// Helper để check quyền trong middleware
export function checkPermission(
  userRole?: Role,
  permission?: keyof typeof can,
  ...args: any[]
): boolean {
  if (!permission || !userRole) return false
  return (can[permission] as any)(userRole, ...args)
}
