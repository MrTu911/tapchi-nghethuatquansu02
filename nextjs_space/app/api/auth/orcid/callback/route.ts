
export const dynamic = "force-dynamic"

/**
 * ORCID OAuth Callback Handler
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import {
  getORCIDConfig,
  getORCIDAccessToken,
  fetchORCIDProfile,
  encryptORCIDToken
} from '@/lib/integrations/orcid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/profile?error=missing_code', request.url)
      )
    }

    // Verify CSRF state before doing anything else
    const storedState = request.cookies.get('orcid-state')?.value
    if (!state || !storedState || state !== storedState) {
      logger.warn({ message: 'ORCID callback: CSRF state mismatch' })
      return NextResponse.redirect(
        new URL('/dashboard/profile?error=invalid_state', request.url)
      )
    }

    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      )
    }

    const config = getORCIDConfig()

    // Exchange code for access token
    const tokenData = await getORCIDAccessToken(code, config)

    // Fetch ORCID profile
    const profile = await fetchORCIDProfile(
      tokenData.orcid,
      tokenData.access_token,
      config
    )

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/dashboard/profile?error=user_not_found', request.url)
      )
    }

    // Encrypt tokens before storing in DB
    const encryptedAccessToken = encryptORCIDToken(tokenData.access_token)
    const encryptedRefreshToken = tokenData.refresh_token
      ? encryptORCIDToken(tokenData.refresh_token)
      : null

    // Save or update ORCID profile
    await prisma.oRCIDProfile.upsert({
      where: { userId: user.id },
      update: {
        orcidId: profile.orcidId,
        fullName: profile.fullName,
        biography: profile.biography,
        affiliations: profile.affiliations,
        works: profile.works,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        lastSyncAt: new Date()
      },
      create: {
        userId: user.id,
        orcidId: profile.orcidId,
        fullName: profile.fullName,
        biography: profile.biography,
        affiliations: profile.affiliations,
        works: profile.works,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        lastSyncAt: new Date()
      }
    })

    const response = NextResponse.redirect(
      new URL('/dashboard/profile?orcid=connected', request.url)
    )
    // Clear the CSRF state cookie
    response.cookies.delete('orcid-state')
    return response
  } catch (error) {
    logger.error({ message: 'ORCID callback error:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.redirect(
      new URL('/dashboard/profile?error=orcid_failed', request.url)
    )
  }
}
