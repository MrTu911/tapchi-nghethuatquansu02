
export const dynamic = "force-dynamic"

/**
 * ORCID OAuth Initiation
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { getORCIDConfig, getORCIDAuthUrl } from '@/lib/integrations/orcid'
import { getServerSession } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const config = getORCIDConfig()

    if (!config.clientId) {
      return NextResponse.json(
        { error: 'ORCID integration not configured' },
        { status: 500 }
      )
    }

    // Use cryptographically secure random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')
    const authUrl = getORCIDAuthUrl(config, state)

    const response = NextResponse.json({ authUrl })
    // Store state in httpOnly cookie for CSRF verification in callback
    response.cookies.set('orcid-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/'
    })

    return response
  } catch (error) {
    logger.error({ message: 'ORCID auth error:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to initialize ORCID authentication' },
      { status: 500 }
    )
  }
}
