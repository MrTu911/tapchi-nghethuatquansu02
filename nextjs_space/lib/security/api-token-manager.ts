
/**
 * 🔑 API TOKEN MANAGEMENT SYSTEM
 * Quản lý API tokens cho integration
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { createAuditLog } from '../audit-logger'

const prisma = new PrismaClient()

export interface ApiToken {
  id: string
  name: string
  userId: string
  token: string
  permissions: string[]
  expiresAt?: Date
  lastUsedAt?: Date
  isActive: boolean
  createdAt: Date
}

/**
 * Tạo API token mới
 */
export async function createApiToken(
  userId: string,
  name: string,
  permissions: string[],
  expiresInDays?: number
): Promise<{ token: string; id: string }> {
  // Tạo token ngẫu nhiên
  const token = `ntqs_${crypto.randomBytes(32).toString('hex')}`
  
  // Tính expiry date
  let expiresAt: Date | undefined
  if (expiresInDays) {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
  }
  
  // Hash token trước khi lưu
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  
  const apiToken = await prisma.apiToken.create({
    data: {
      name,
      userId,
      tokenHash,
      permissions,
      expiresAt,
      isActive: true
    }
  })
  
  await createAuditLog({
    userId,
    action: 'CREATE_API_TOKEN',
    entity: 'API_TOKEN',
    entityId: apiToken.id,
    metadata: {
      tokenName: name,
      permissions,
      expiresInDays
    }
  })
  
  return {
    token, // Trả về token gốc (chỉ hiển thị 1 lần)
    id: apiToken.id
  }
}

/**
 * Xác thực API token
 */
export async function validateApiToken(
  token: string
): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  
  const apiToken = await prisma.apiToken.findFirst({
    where: {
      tokenHash,
      isActive: true
    }
  })
  
  if (!apiToken) {
    return { valid: false }
  }
  
  // Kiểm tra expiry
  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return { valid: false }
  }
  
  // Cập nhật last used
  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() }
  })
  
  return {
    valid: true,
    userId: apiToken.userId,
    permissions: apiToken.permissions
  }
}

/**
 * Lấy danh sách API tokens của user
 */
export async function getUserApiTokens(userId: string): Promise<Omit<ApiToken, 'token'>[]> {
  const tokens = await prisma.apiToken.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
  
  return tokens.map(t => ({
    id: t.id,
    name: t.name,
    userId: t.userId,
    token: '••••••••', // Không hiển thị token
    permissions: t.permissions,
    expiresAt: t.expiresAt || undefined,
    lastUsedAt: t.lastUsedAt || undefined,
    isActive: t.isActive,
    createdAt: t.createdAt
  }))
}

/**
 * Revoke API token
 */
export async function revokeApiToken(
  tokenId: string,
  userId: string
): Promise<void> {
  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { isActive: false }
  })
  
  await createAuditLog({
    userId,
    action: 'REVOKE_API_TOKEN',
    entity: 'API_TOKEN',
    entityId: tokenId,
    metadata: {}
  })
}

/**
 * Xóa API token
 */
export async function deleteApiToken(
  tokenId: string,
  userId: string
): Promise<void> {
  await prisma.apiToken.delete({
    where: { id: tokenId }
  })
  
  await createAuditLog({
    userId,
    action: 'DELETE_API_TOKEN',
    entity: 'API_TOKEN',
    entityId: tokenId,
    metadata: {}
  })
}

/**
 * Lấy thống kê API tokens
 */
export async function getApiTokenStats() {
  const [total, active, expired] = await Promise.all([
    prisma.apiToken.count(),
    prisma.apiToken.count({ where: { isActive: true } }),
    prisma.apiToken.count({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  ])
  
  return {
    total,
    active,
    expired,
    inactive: total - active
  }
}
