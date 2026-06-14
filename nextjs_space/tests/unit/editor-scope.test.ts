/**
 * Unit tests — lib/editor-scope.ts (scope chuyên mục cho biên tập).
 *
 * Quy tắc: SECTION_EDITOR chỉ phụ trách bài được phân công (assignedEditorId === uid);
 * vai trò giám sát (MANAGING_EDITOR/EIC/SYSADMIN/LAYOUT_EDITOR/SECURITY_AUDITOR/COMMANDER)
 * thấy tất cả; vai trò khác không có scope biên tập.
 */

import {
  editorSeesAll,
  submissionScopeWhere,
  submissionRelationScope,
  canEditorAccessSubmission,
} from '../../lib/editor-scope'

describe('editorSeesAll', () => {
  it('các vai trò giám sát → true', () => {
    for (const r of ['MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'LAYOUT_EDITOR', 'SECURITY_AUDITOR', 'COMMANDER']) {
      expect(editorSeesAll(r)).toBe(true)
    }
  })
  it('SECTION_EDITOR / REVIEWER / AUTHOR → false', () => {
    for (const r of ['SECTION_EDITOR', 'REVIEWER', 'AUTHOR']) {
      expect(editorSeesAll(r)).toBe(false)
    }
  })
  it('undefined → false', () => {
    expect(editorSeesAll(undefined)).toBe(false)
  })
})

describe('canEditorAccessSubmission', () => {
  it('SECTION_EDITOR chỉ truy cập bài phân công cho mình', () => {
    expect(canEditorAccessSubmission('SECTION_EDITOR', 'ed-1', 'ed-1')).toBe(true)
    expect(canEditorAccessSubmission('SECTION_EDITOR', 'ed-1', 'ed-2')).toBe(false)
    expect(canEditorAccessSubmission('SECTION_EDITOR', 'ed-1', null)).toBe(false)
    expect(canEditorAccessSubmission('SECTION_EDITOR', 'ed-1', undefined)).toBe(false)
  })
  it('vai trò giám sát truy cập mọi bài', () => {
    expect(canEditorAccessSubmission('MANAGING_EDITOR', 'me-1', null)).toBe(true)
    expect(canEditorAccessSubmission('EIC', 'eic-1', 'ed-2')).toBe(true)
  })
  it('vai trò không phải biên tập → false', () => {
    expect(canEditorAccessSubmission('REVIEWER', 'r-1', 'r-1')).toBe(false)
    expect(canEditorAccessSubmission('AUTHOR', 'a-1', 'a-1')).toBe(false)
  })
})

describe('submissionScopeWhere', () => {
  it('vai trò giám sát → {} (không giới hạn)', () => {
    expect(submissionScopeWhere('EIC', 'eic-1')).toEqual({})
  })
  it('SECTION_EDITOR → lọc theo assignedEditorId', () => {
    expect(submissionScopeWhere('SECTION_EDITOR', 'ed-1')).toEqual({ assignedEditorId: 'ed-1' })
  })
  it('vai trò khác → chặn sạch (id sentinel)', () => {
    const w = submissionScopeWhere('AUTHOR', 'a-1') as any
    expect(w.id).toBeDefined()
    expect(w.id).not.toBe('a-1')
  })
})

describe('submissionRelationScope', () => {
  it('vai trò giám sát → {}', () => {
    expect(submissionRelationScope('SYSADMIN', 's-1')).toEqual({})
  })
  it('SECTION_EDITOR → lồng submission.assignedEditorId', () => {
    expect(submissionRelationScope('SECTION_EDITOR', 'ed-1')).toEqual({
      submission: { assignedEditorId: 'ed-1' },
    })
  })
})
