/**
 * Unit tests — lib/workflow.ts
 *
 * Kiểm tra state machine chuyển trạng thái bài báo:
 * - Transitions hợp lệ / không hợp lệ
 * - autoDecideNextStatus dựa trên recommendations phản biện
 * - getAvailableActions theo vai trò
 * - isReviewerAvailable / calculateWorkloadScore
 */

import {
  WORKFLOW_TRANSITIONS,
  isValidTransition,
  autoDecideNextStatus,
  getAvailableActions,
  isReviewerAvailable,
  calculateWorkloadScore,
  getStatusColor,
  canMakeDecision,
  mapDecisionToStatus,
  DECISION_ELIGIBLE_STATUSES,
  DECISION_TARGET_STATUS,
} from '../../lib/workflow'
import type { SubmissionStatus } from '@prisma/client'

// Mock @prisma/client để tránh phụ thuộc DB
jest.mock('@prisma/client', () => ({
  SubmissionStatus: {},
  Recommendation: {},
  Decision: {},
}))

const ALL_STATUSES: SubmissionStatus[] = [
  'NEW', 'DESK_REJECT', 'UNDER_REVIEW', 'REVISION',
  'ACCEPTED', 'REJECTED', 'IN_PRODUCTION', 'PUBLISHED',
]

// ─── isValidTransition ────────────────────────────────────────────────────────

describe('isValidTransition', () => {
  describe('từ trạng thái NEW', () => {
    it('cho phép NEW → DESK_REJECT', () => {
      expect(isValidTransition('NEW', 'DESK_REJECT')).toBe(true)
    })
    it('cho phép NEW → UNDER_REVIEW', () => {
      expect(isValidTransition('NEW', 'UNDER_REVIEW')).toBe(true)
    })
    it('không cho phép NEW → PUBLISHED (nhảy cóc)', () => {
      expect(isValidTransition('NEW', 'PUBLISHED')).toBe(false)
    })
    it('không cho phép NEW → ACCEPTED', () => {
      expect(isValidTransition('NEW', 'ACCEPTED')).toBe(false)
    })
  })

  describe('terminal states', () => {
    it('DESK_REJECT không có transition nào', () => {
      expect(WORKFLOW_TRANSITIONS['DESK_REJECT']).toHaveLength(0)
    })
    it('REJECTED không có transition nào', () => {
      expect(WORKFLOW_TRANSITIONS['REJECTED']).toHaveLength(0)
    })
    it('PUBLISHED không có transition nào', () => {
      expect(WORKFLOW_TRANSITIONS['PUBLISHED']).toHaveLength(0)
    })
  })

  describe('từ UNDER_REVIEW', () => {
    it('cho phép UNDER_REVIEW → REVISION', () => {
      expect(isValidTransition('UNDER_REVIEW', 'REVISION')).toBe(true)
    })
    it('cho phép UNDER_REVIEW → ACCEPTED', () => {
      expect(isValidTransition('UNDER_REVIEW', 'ACCEPTED')).toBe(true)
    })
    it('cho phép UNDER_REVIEW → REJECTED', () => {
      expect(isValidTransition('UNDER_REVIEW', 'REJECTED')).toBe(true)
    })
    it('không cho phép UNDER_REVIEW → NEW (quay ngược)', () => {
      expect(isValidTransition('UNDER_REVIEW', 'NEW')).toBe(false)
    })
  })

  describe('vòng đời đầy đủ', () => {
    it('cho phép REVISION → UNDER_REVIEW (tác giả nộp lại)', () => {
      expect(isValidTransition('REVISION', 'UNDER_REVIEW')).toBe(true)
    })
    it('cho phép ACCEPTED → IN_PRODUCTION', () => {
      expect(isValidTransition('ACCEPTED', 'IN_PRODUCTION')).toBe(true)
    })
    it('cho phép IN_PRODUCTION → PUBLISHED', () => {
      expect(isValidTransition('IN_PRODUCTION', 'PUBLISHED')).toBe(true)
    })
    it('không cho phép ACCEPTED → PUBLISHED (bỏ qua IN_PRODUCTION)', () => {
      expect(isValidTransition('ACCEPTED', 'PUBLISHED')).toBe(false)
    })
  })
})

// ─── autoDecideNextStatus ─────────────────────────────────────────────────────

describe('autoDecideNextStatus', () => {
  it('trả null nếu không có review nào', () => {
    expect(autoDecideNextStatus([])).toBeNull()
  })

  it('trả null nếu chưa có recommendation nào', () => {
    expect(autoDecideNextStatus([{ recommendation: null }, { recommendation: null }])).toBeNull()
  })

  it('REJECTED khi có 2+ REJECT', () => {
    const reviews = [
      { recommendation: 'REJECT' as const },
      { recommendation: 'REJECT' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('REJECTED')
  })

  it('REJECTED khi có 3 REJECT', () => {
    const reviews = [
      { recommendation: 'REJECT' as const },
      { recommendation: 'REJECT' as const },
      { recommendation: 'ACCEPT' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('REJECTED')
  })

  it('REVISION khi có 2+ MAJOR', () => {
    const reviews = [
      { recommendation: 'MAJOR' as const },
      { recommendation: 'MAJOR' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('REVISION')
  })

  it('REVISION khi có 2+ MINOR', () => {
    const reviews = [
      { recommendation: 'MINOR' as const },
      { recommendation: 'MINOR' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('REVISION')
  })

  it('ACCEPTED khi có 2+ ACCEPT', () => {
    const reviews = [
      { recommendation: 'ACCEPT' as const },
      { recommendation: 'ACCEPT' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('ACCEPTED')
  })

  it('null (mixed) khi 1 ACCEPT + 1 REJECT — editor phải quyết', () => {
    const reviews = [
      { recommendation: 'ACCEPT' as const },
      { recommendation: 'REJECT' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBeNull()
  })

  it('REJECT có độ ưu tiên cao hơn MAJOR', () => {
    // 2 REJECT + 1 MAJOR → REJECTED (không phải REVISION)
    const reviews = [
      { recommendation: 'REJECT' as const },
      { recommendation: 'REJECT' as const },
      { recommendation: 'MAJOR' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('REJECTED')
  })

  it('bỏ qua review chưa có recommendation', () => {
    const reviews = [
      { recommendation: null },
      { recommendation: 'ACCEPT' as const },
      { recommendation: 'ACCEPT' as const },
    ]
    expect(autoDecideNextStatus(reviews)).toBe('ACCEPTED')
  })
})

// ─── getAvailableActions ──────────────────────────────────────────────────────

describe('getAvailableActions', () => {
  describe('từ trạng thái NEW', () => {
    it('SECTION_EDITOR có thể desk-reject hoặc gửi phản biện', () => {
      const actions = getAvailableActions('NEW', 'SECTION_EDITOR')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('desk_reject')
      expect(labels).toContain('send_to_review')
    })

    it('AUTHOR không có action nào từ NEW', () => {
      const actions = getAvailableActions('NEW', 'AUTHOR')
      expect(actions).toHaveLength(0)
    })

    it('REVIEWER không có action nào từ NEW', () => {
      const actions = getAvailableActions('NEW', 'REVIEWER')
      expect(actions).toHaveLength(0)
    })

    it('EIC có đầy đủ quyền như SECTION_EDITOR từ NEW', () => {
      const actions = getAvailableActions('NEW', 'EIC')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('desk_reject')
      expect(labels).toContain('send_to_review')
    })
  })

  describe('từ UNDER_REVIEW', () => {
    it('SECTION_EDITOR có thể yêu cầu revision hoặc reject nhưng KHÔNG accept', () => {
      const actions = getAvailableActions('UNDER_REVIEW', 'SECTION_EDITOR')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('request_revision')
      expect(labels).toContain('reject')
      // SECTION_EDITOR không có quyền accept
      expect(labels).not.toContain('accept')
    })

    it('MANAGING_EDITOR có thể accept', () => {
      const actions = getAvailableActions('UNDER_REVIEW', 'MANAGING_EDITOR')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('accept')
    })

    it('EIC có thể accept', () => {
      const actions = getAvailableActions('UNDER_REVIEW', 'EIC')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('accept')
    })
  })

  describe('publish chỉ dành cho EIC và SYSADMIN', () => {
    it('EIC có thể publish từ IN_PRODUCTION', () => {
      const actions = getAvailableActions('IN_PRODUCTION', 'EIC')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('publish')
    })

    it('SYSADMIN có thể publish từ IN_PRODUCTION', () => {
      const actions = getAvailableActions('IN_PRODUCTION', 'SYSADMIN')
      const labels = actions.map(a => a.action)
      expect(labels).toContain('publish')
    })

    it('MANAGING_EDITOR không thể publish', () => {
      const actions = getAvailableActions('IN_PRODUCTION', 'MANAGING_EDITOR')
      const labels = actions.map(a => a.action)
      expect(labels).not.toContain('publish')
    })
  })

  describe('terminal states không có action', () => {
    it('PUBLISHED không có action nào', () => {
      expect(getAvailableActions('PUBLISHED', 'EIC')).toHaveLength(0)
    })
    it('REJECTED không có action nào', () => {
      expect(getAvailableActions('REJECTED', 'SYSADMIN')).toHaveLength(0)
    })
    it('DESK_REJECT không có action nào', () => {
      expect(getAvailableActions('DESK_REJECT', 'SYSADMIN')).toHaveLength(0)
    })
  })
})

// ─── isReviewerAvailable ──────────────────────────────────────────────────────

describe('isReviewerAvailable', () => {
  it('available khi workload = 0', () => {
    expect(isReviewerAvailable(0)).toBe(true)
  })
  it('available khi workload = 4 (dưới max 5)', () => {
    expect(isReviewerAvailable(4)).toBe(true)
  })
  it('không available khi workload = 5 (đạt max)', () => {
    expect(isReviewerAvailable(5)).toBe(false)
  })
  it('không available khi workload > 5', () => {
    expect(isReviewerAvailable(10)).toBe(false)
  })
  it('max workload có thể tùy chỉnh', () => {
    expect(isReviewerAvailable(3, 3)).toBe(false)
    expect(isReviewerAvailable(2, 3)).toBe(true)
  })
})

// ─── calculateWorkloadScore ───────────────────────────────────────────────────

describe('calculateWorkloadScore', () => {
  it('score = 0 khi không có review nào', () => {
    expect(calculateWorkloadScore([])).toBe(0)
  })

  it('pending review tính nặng hơn completed (pending * 2)', () => {
    const reviews = [
      { submittedAt: null },   // pending → 2 điểm
      { submittedAt: new Date() }, // completed → 1 điểm
    ]
    expect(calculateWorkloadScore(reviews)).toBe(3)
  })

  it('2 pending = score 4', () => {
    const reviews = [{ submittedAt: null }, { submittedAt: null }]
    expect(calculateWorkloadScore(reviews)).toBe(4)
  })

  it('2 completed = score 2', () => {
    const reviews = [{ submittedAt: new Date() }, { submittedAt: new Date() }]
    expect(calculateWorkloadScore(reviews)).toBe(2)
  })
})

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('trả về class CSS cho mỗi trạng thái', () => {
    const allStatuses = Object.keys(WORKFLOW_TRANSITIONS) as Array<keyof typeof WORKFLOW_TRANSITIONS>
    for (const status of allStatuses) {
      const color = getStatusColor(status)
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })

  it('PUBLISHED có màu emerald (tích cực)', () => {
    expect(getStatusColor('PUBLISHED')).toContain('emerald')
  })

  it('DESK_REJECT có màu đỏ', () => {
    expect(getStatusColor('DESK_REJECT')).toContain('red')
  })
})

// ─── Ma trận transition đầy đủ ────────────────────────────────────────────────

describe('WORKFLOW_TRANSITIONS — ma trận đầy đủ', () => {
  it('isValidTransition khớp đúng bảng WORKFLOW_TRANSITIONS cho MỌI cặp', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const expected = WORKFLOW_TRANSITIONS[from].includes(to)
        expect(isValidTransition(from, to)).toBe(expected)
      }
    }
  })

  it('các trạng thái terminal không có transition đi ra', () => {
    for (const terminal of ['DESK_REJECT', 'REJECTED', 'PUBLISHED'] as SubmissionStatus[]) {
      expect(WORKFLOW_TRANSITIONS[terminal]).toHaveLength(0)
    }
  })

  it('không trạng thái nào tự chuyển về chính nó', () => {
    for (const s of ALL_STATUSES) {
      expect(WORKFLOW_TRANSITIONS[s]).not.toContain(s)
    }
  })

  it('mọi đích đến đều là trạng thái hợp lệ', () => {
    for (const s of ALL_STATUSES) {
      for (const target of WORKFLOW_TRANSITIONS[s]) {
        expect(ALL_STATUSES).toContain(target)
      }
    }
  })
})

// ─── canMakeDecision — guard trạng thái nguồn khi ra quyết định ────────────────

describe('canMakeDecision', () => {
  it('cho phép ở UNDER_REVIEW và REVISION', () => {
    expect(canMakeDecision('UNDER_REVIEW')).toBe(true)
    expect(canMakeDecision('REVISION')).toBe(true)
  })

  it('CHẶN ở NEW (chưa phản biện)', () => {
    expect(canMakeDecision('NEW')).toBe(false)
  })

  it('CHẶN ở các trạng thái terminal và sau-quyết-định', () => {
    for (const s of ['DESK_REJECT', 'ACCEPTED', 'REJECTED', 'IN_PRODUCTION', 'PUBLISHED'] as SubmissionStatus[]) {
      expect(canMakeDecision(s)).toBe(false)
    }
  })

  it('DECISION_ELIGIBLE_STATUSES đúng tập', () => {
    expect([...DECISION_ELIGIBLE_STATUSES].sort()).toEqual(['REVISION', 'UNDER_REVIEW'])
  })
})

// ─── mapDecisionToStatus — ánh xạ quyết định → trạng thái đích ─────────────────

describe('mapDecisionToStatus', () => {
  // REGRESSION (2026-06-14): ACCEPT đưa bài về ACCEPTED — KHÔNG nhảy thẳng IN_PRODUCTION.
  // Trước đây ACCEPT→IN_PRODUCTION gây hai nguồn sự thật mâu thuẫn với /api/workflow
  // (accept→ACCEPTED) và bỏ qua mốc two-person rule. Xem [[editor_flow_revamp]].
  it('ACCEPT → ACCEPTED (mốc duyệt nội dung, chưa vào dàn trang)', () => {
    expect(mapDecisionToStatus('ACCEPT')).toBe('ACCEPTED')
  })

  it('ACCEPT KHÔNG được đi thẳng IN_PRODUCTION (chống tái phát bug gộp bước)', () => {
    expect(mapDecisionToStatus('ACCEPT')).not.toBe('IN_PRODUCTION')
  })

  it('MINOR và MAJOR → REVISION', () => {
    expect(mapDecisionToStatus('MINOR')).toBe('REVISION')
    expect(mapDecisionToStatus('MAJOR')).toBe('REVISION')
  })

  it('REJECT → REJECTED', () => {
    expect(mapDecisionToStatus('REJECT')).toBe('REJECTED')
  })

  it('mọi đích đến của quyết định đều là SubmissionStatus hợp lệ', () => {
    for (const decision of ['ACCEPT', 'MINOR', 'MAJOR', 'REJECT'] as const) {
      expect(ALL_STATUSES).toContain(DECISION_TARGET_STATUS[decision])
    }
  })
})

// ─── Regression: guard transition của khâu quyết định ─────────────────────────
// Bảo vệ bất biến: route /api/submissions/[id]/decision có guard isValidTransition.
// Mọi quyết định hợp lệ từ UNDER_REVIEW phải qua guard; ở REVISION chỉ REJECT qua.

describe('decision flow — guard transition (regression)', () => {
  const DECISIONS = ['ACCEPT', 'MINOR', 'MAJOR', 'REJECT'] as const

  it('MỌI quyết định từ UNDER_REVIEW đều là transition hợp lệ (guard không chặn nhầm)', () => {
    for (const d of DECISIONS) {
      expect(isValidTransition('UNDER_REVIEW', mapDecisionToStatus(d))).toBe(true)
    }
  })

  it('ACCEPT từ UNDER_REVIEW → ACCEPTED là transition hợp lệ', () => {
    expect(isValidTransition('UNDER_REVIEW', mapDecisionToStatus('ACCEPT'))).toBe(true)
  })

  it('từ REVISION chỉ REJECT là hợp lệ; ACCEPT/MINOR/MAJOR bị guard chặn (phải chờ nộp lại)', () => {
    expect(isValidTransition('REVISION', mapDecisionToStatus('REJECT'))).toBe(true)
    expect(isValidTransition('REVISION', mapDecisionToStatus('ACCEPT'))).toBe(false)
    expect(isValidTransition('REVISION', mapDecisionToStatus('MINOR'))).toBe(false)
    expect(isValidTransition('REVISION', mapDecisionToStatus('MAJOR'))).toBe(false)
  })

  it('luồng chấp nhận 2 bước: UNDER_REVIEW → ACCEPTED → IN_PRODUCTION đều hợp lệ', () => {
    expect(isValidTransition('UNDER_REVIEW', 'ACCEPTED')).toBe(true)
    expect(isValidTransition('ACCEPTED', 'IN_PRODUCTION')).toBe(true)
  })
})
