/**
 * GET  /api/admin/workflow/config  — Lấy toàn bộ cấu hình bước workflow
 * PATCH /api/admin/workflow/config  — Cập nhật một bước workflow
 *
 * Chỉ SYSADMIN và EIC được phép thao tác.
 */

import { NextRequest } from 'next/server'
import { DeadlineType } from '@prisma/client'
import { getServerSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import {
  listStepConfigs,
  updateStepConfig,
} from '@/lib/services/workflow-config.service'

const ALLOWED_ROLES = ['SYSADMIN', 'EIC']

const VALID_STEP_TYPES = new Set<string>([
  'INITIAL_REVIEW',
  'REVISION_SUBMIT',
  'RE_REVIEW',
  'EDITOR_DECISION',
  'PRODUCTION',
  'PUBLICATION',
])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Forbidden', 403)

    const configs = await listStepConfigs()
    return successResponse(configs)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return errorResponse(msg, 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!ALLOWED_ROLES.includes(session.role)) return errorResponse('Forbidden', 403)

    const body = await request.json()
    const { stepType, deadlineDays, reminderDays, maxReminders, isActive } = body

    if (!stepType || !VALID_STEP_TYPES.has(stepType)) {
      return errorResponse('stepType không hợp lệ', 400)
    }

    if (deadlineDays !== undefined) {
      if (typeof deadlineDays !== 'number' || deadlineDays < 1 || deadlineDays > 365) {
        return errorResponse('deadlineDays phải là số nguyên từ 1 đến 365', 400)
      }
    }

    if (reminderDays !== undefined) {
      if (typeof reminderDays !== 'number' || reminderDays < 1 || reminderDays > 30) {
        return errorResponse('reminderDays phải là số nguyên từ 1 đến 30', 400)
      }
    }

    if (maxReminders !== undefined) {
      if (typeof maxReminders !== 'number' || maxReminders < 0 || maxReminders > 10) {
        return errorResponse('maxReminders phải là số nguyên từ 0 đến 10', 400)
      }
    }

    const updated = await updateStepConfig(
      stepType as DeadlineType,
      { deadlineDays, reminderDays, maxReminders, isActive },
      session.uid
    )

    return successResponse(updated, 'Cập nhật cấu hình thành công')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return errorResponse(msg, 500)
  }
}
