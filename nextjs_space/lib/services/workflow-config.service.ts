/**
 * WorkflowConfig Service
 * Đọc cấu hình deadline từng bước từ DB thay vì hard-code.
 * Nếu DB chưa có hoặc bước chưa được config, fallback về giá trị mặc định.
 */

import { DeadlineType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface StepConfigValue {
  stepType: DeadlineType
  label: string
  deadlineDays: number
  reminderDays: number
  maxReminders: number
  isActive: boolean
}

/**
 * Giá trị mặc định — bảo toàn behavior trước khi có bảng config.
 * Chỉ dùng khi bảng trống hoặc bước chưa tồn tại.
 */
const FALLBACK_DEFAULTS: Record<DeadlineType, StepConfigValue> = {
  INITIAL_REVIEW: {
    stepType: 'INITIAL_REVIEW',
    label: 'Phản biện ban đầu',
    deadlineDays: 21,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
  REVISION_SUBMIT: {
    stepType: 'REVISION_SUBMIT',
    label: 'Tác giả nộp bản sửa',
    deadlineDays: 14,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
  RE_REVIEW: {
    stepType: 'RE_REVIEW',
    label: 'Phản biện lại sau sửa',
    deadlineDays: 14,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
  EDITOR_DECISION: {
    stepType: 'EDITOR_DECISION',
    label: 'Biên tập viên ra quyết định',
    deadlineDays: 7,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
  PRODUCTION: {
    stepType: 'PRODUCTION',
    label: 'Sản xuất / Dàn trang',
    deadlineDays: 14,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
  PUBLICATION: {
    stepType: 'PUBLICATION',
    label: 'Xuất bản chính thức',
    deadlineDays: 7,
    reminderDays: 3,
    maxReminders: 2,
    isActive: true,
  },
}

/**
 * Lấy config của một bước workflow cụ thể.
 * Nếu bảng config chưa có bản ghi cho bước này, trả về fallback.
 */
export async function getStepConfig(stepType: DeadlineType): Promise<StepConfigValue> {
  try {
    const config = await prisma.workflowStepConfig.findUnique({
      where: { stepType },
    })

    if (!config) {
      return FALLBACK_DEFAULTS[stepType]
    }

    return {
      stepType: config.stepType as DeadlineType,
      label: config.label,
      deadlineDays: config.deadlineDays,
      reminderDays: config.reminderDays,
      maxReminders: config.maxReminders,
      isActive: config.isActive,
    }
  } catch {
    // DB chưa có bảng hoặc lỗi kết nối — không crash, dùng fallback
    return FALLBACK_DEFAULTS[stepType]
  }
}

/**
 * Lấy toàn bộ config các bước workflow.
 * Merge DB records với fallback để luôn trả đủ 6 bước.
 */
export async function listStepConfigs(): Promise<StepConfigValue[]> {
  try {
    const dbConfigs = await prisma.workflowStepConfig.findMany({
      orderBy: { stepType: 'asc' },
    })

    const dbMap = new Map(dbConfigs.map((c) => [c.stepType, c]))

    return (Object.keys(FALLBACK_DEFAULTS) as DeadlineType[]).map((stepType) => {
      const db = dbMap.get(stepType)
      if (!db) return FALLBACK_DEFAULTS[stepType]

      return {
        stepType: db.stepType as DeadlineType,
        label: db.label,
        deadlineDays: db.deadlineDays,
        reminderDays: db.reminderDays,
        maxReminders: db.maxReminders,
        isActive: db.isActive,
      }
    })
  } catch {
    return Object.values(FALLBACK_DEFAULTS)
  }
}

/**
 * Cập nhật config một bước.
 * Dùng upsert để xử lý cả trường hợp chưa có bản ghi.
 */
export async function updateStepConfig(
  stepType: DeadlineType,
  data: {
    deadlineDays?: number
    reminderDays?: number
    maxReminders?: number
    isActive?: boolean
  },
  updatedBy?: string
): Promise<StepConfigValue> {
  const fallback = FALLBACK_DEFAULTS[stepType]

  const config = await prisma.workflowStepConfig.upsert({
    where: { stepType },
    create: {
      stepType,
      label: fallback.label,
      deadlineDays: data.deadlineDays ?? fallback.deadlineDays,
      reminderDays: data.reminderDays ?? fallback.reminderDays,
      maxReminders: data.maxReminders ?? fallback.maxReminders,
      isActive: data.isActive ?? fallback.isActive,
      updatedBy,
    },
    update: {
      ...(data.deadlineDays !== undefined && { deadlineDays: data.deadlineDays }),
      ...(data.reminderDays !== undefined && { reminderDays: data.reminderDays }),
      ...(data.maxReminders !== undefined && { maxReminders: data.maxReminders }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedBy,
    },
  })

  return {
    stepType: config.stepType as DeadlineType,
    label: config.label,
    deadlineDays: config.deadlineDays,
    reminderDays: config.reminderDays,
    maxReminders: config.maxReminders,
    isActive: config.isActive,
  }
}
