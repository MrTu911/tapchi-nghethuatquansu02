import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const buildId = readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf-8').trim()
    return NextResponse.json({ success: true, data: { buildId } })
  } catch {
    // In dev mode or if BUILD_ID is missing, return sentinel to skip comparison
    return NextResponse.json({ success: true, data: { buildId: 'dev' } })
  }
}
