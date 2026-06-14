
/**
 * ORCID Integration Library
 * Handles OAuth authentication and profile synchronization with ORCID
 */

import crypto from 'crypto'

function getORCIDEncryptionKey(): Buffer {
  // Use a dedicated key separate from JWT_SECRET so they can be rotated independently
  const secret = process.env.ORCID_ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!secret) throw new Error('ORCID_ENCRYPTION_KEY env variable is not set')
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt an ORCID OAuth token for storage in DB.
 * Uses AES-256-GCM with a random IV prepended to the ciphertext.
 */
export function encryptORCIDToken(plaintext: string): string {
  const key = getORCIDEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Decrypt an ORCID OAuth token retrieved from DB.
 */
export function decryptORCIDToken(ciphertext: string): string {
  const key = getORCIDEncryptionKey()
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}

export interface ORCIDProfile {
  orcidId: string
  fullName: string
  biography?: string
  affiliations: string[]
  works?: any[]
}

export interface ORCIDConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  sandbox?: boolean
}

/**
 * Get ORCID OAuth URL for user authorization
 */
export function getORCIDAuthUrl(config: ORCIDConfig, state: string): string {
  const baseUrl = config.sandbox
    ? 'https://sandbox.orcid.org/oauth/authorize'
    : 'https://orcid.org/oauth/authorize'

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: '/authenticate /read-limited',
    redirect_uri: config.redirectUri,
    state
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function getORCIDAccessToken(
  code: string,
  config: ORCIDConfig
): Promise<{
  access_token: string
  refresh_token: string
  orcid: string
  name: string
}> {
  const baseUrl = config.sandbox
    ? 'https://sandbox.orcid.org/oauth/token'
    : 'https://orcid.org/oauth/token'

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri
    })
  })

  if (!response.ok) {
    throw new Error('Failed to exchange ORCID authorization code')
  }

  return await response.json()
}

/**
 * Fetch ORCID profile data
 */
export async function fetchORCIDProfile(
  orcidId: string,
  accessToken: string,
  config: ORCIDConfig
): Promise<ORCIDProfile> {
  const baseUrl = config.sandbox
    ? `https://pub.sandbox.orcid.org/v3.0/${orcidId}`
    : `https://pub.orcid.org/v3.0/${orcidId}`

  const response = await fetch(`${baseUrl}/record`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch ORCID profile')
  }

  const data = await response.json()

  // Parse ORCID response
  const person = data.person || {}
  const biography = person.biography?.content || ''
  const name = person.name || {}
  const fullName = `${name['given-names']?.value || ''} ${name['family-name']?.value || ''}`.trim()

  const affiliations =
    person['employments']?.['affiliation-group']?.map((group: any) => {
      const affiliation = group['summaries']?.[0]?.['employment-summary']
      return affiliation?.['organization']?.['name'] || ''
    }) || []

  const works = data['activities-summary']?.['works']?.['group'] || []

  return {
    orcidId,
    fullName,
    biography,
    affiliations: affiliations.filter(Boolean),
    works
  }
}

/**
 * Refresh ORCID access token
 */
export async function refreshORCIDToken(
  refreshToken: string,
  config: ORCIDConfig
): Promise<{ access_token: string; refresh_token: string }> {
  const baseUrl = config.sandbox
    ? 'https://sandbox.orcid.org/oauth/token'
    : 'https://orcid.org/oauth/token'

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    throw new Error('Failed to refresh ORCID access token')
  }

  return await response.json()
}

/**
 * Get ORCID configuration from environment
 */
export function getORCIDConfig(): ORCIDConfig {
  return {
    clientId: process.env.ORCID_CLIENT_ID || '',
    clientSecret: process.env.ORCID_CLIENT_SECRET || '',
    redirectUri: process.env.ORCID_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/orcid/callback`,
    sandbox: process.env.ORCID_SANDBOX === 'true'
  }
}

/**
 * Validate ORCID ID format
 */
export function validateORCIDId(orcidId: string): boolean {
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/
  return orcidRegex.test(orcidId)
}
