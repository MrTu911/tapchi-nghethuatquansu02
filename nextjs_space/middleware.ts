

import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from './lib/auth-edge'
import { checkRateLimit } from './lib/rate-limiter'

/**
 * ✅ Giai đoạn 2: Rate Limiting with Redis/Memory fallback
 * Tự động dùng Redis nếu có UPSTASH_REDIS_REST_URL
 * Fallback to in-memory nếu không
 */

// Role-based dashboard mapping
const roleDashboardMap: Record<string, string> = {
  'SYSADMIN': '/dashboard/admin',
  'EIC': '/dashboard/eic',
  'DEPUTY_EIC': '/dashboard/deputy',
  'MANAGING_EDITOR': '/dashboard/managing',
  'SECTION_EDITOR': '/dashboard/editor',
  'LAYOUT_EDITOR': '/dashboard/layout',
  'SECURITY_AUDITOR': '/dashboard/security',
  'REVIEWER': '/dashboard/reviewer',
  'AUTHOR': '/dashboard/author',
  'READER': '/dashboard/author',
  'COMMANDER': '/dashboard/commander',
}

// Role-based access control. Phó Tổng biên tập (DEPUTY_EIC) giám sát toàn tòa soạn
// ngang Tổng biên tập, nhưng quyền publish cuối được kiểm ở từng API (EIC-only).
const dashboardAccessControl: Record<string, string[]> = {
  '/dashboard/admin': ['SYSADMIN', 'EIC', 'DEPUTY_EIC', 'MANAGING_EDITOR'],
  '/dashboard/deputy': ['DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  '/dashboard/eic': ['EIC', 'DEPUTY_EIC', 'SYSADMIN'],
  '/dashboard/managing': ['MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  '/dashboard/editor': ['SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'SECURITY_AUDITOR'],
  '/dashboard/layout': ['LAYOUT_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  '/dashboard/security': ['SECURITY_AUDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  '/dashboard/reviewer': ['REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN'],
  '/dashboard/author': ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'LAYOUT_EDITOR', 'MANAGING_EDITOR', 'DEPUTY_EIC', 'EIC', 'SYSADMIN', 'SECURITY_AUDITOR', 'COMMANDER'],
  '/dashboard/commander': ['COMMANDER', 'SYSADMIN'],
}

function hasAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

function getDefaultDashboard(role: string): string {
  return roleDashboardMap[role] || '/dashboard/author'
}

/**
 * ✅ D1: Thêm Security Headers (CSP, XSS Protection)
 */
function addSecurityHeaders(response: NextResponse, pathname?: string): NextResponse {
  // SKIP CSP cho /library + /data/issues — EPUB reader cần Google Fonts CDN
  const isEbookContent = pathname?.startsWith('/data/issues/') || pathname?.startsWith('/library')

  // Content Security Policy (Intranet-optimized) — whitelist Google Fonts + CDN
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // media-src: 'self' cho video/audio đã lưu; blob: cho preview cục bộ + chụp thumbnail offscreen khi upload
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "frame-ancestors 'self'",
  ].join('; ')

  if (!isEbookContent) {
    response.headers.set('Content-Security-Policy', csp)
  }
  
  // XSS Protection
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Strict Transport Security (HSTS) - chỉ ở production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '0.0.0.0'
  const method = request.method

  // ── Rate limiting phân tầng theo mức độ nhạy cảm ───────────────────────────
  // Auth endpoints: giới hạn rất chặt để chống brute-force
  const authEndpoints = ['/api/auth/login', '/api/auth/signin']
  const registerEndpoints = ['/api/auth/register']
  const forgotPasswordEndpoints = ['/api/auth/forgot-password', '/api/auth/reset-password']
  const uploadEndpoints = ['/api/files/upload']
  const otpEndpoints = ['/api/auth/2fa']
  // CPU-heavy GET endpoints that must be rate-limited regardless of method
  const heavyGetEndpoints = ['/api/statistics/export', '/api/articles']
  const generalApiWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (authEndpoints.some(e => pathname.startsWith(e)) && method === 'POST') {
    // Skip rate limiting in development to allow demo account testing
    if (process.env.NODE_ENV !== 'development') {
      // Login: tối đa 5 lần / 15 phút per IP — chống brute-force mật khẩu
      const result = await checkRateLimit(ip, {
        maxRequests: 5,
        windowMs: 15 * 60_000,
        keyPrefix: 'auth-login'
      })
      if (result.limited) {
        return new NextResponse(JSON.stringify({
          error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
          remaining: result.remaining,
          resetAt: result.resetAt
        }), {
          status: 429,
          headers: {
            'Retry-After': '900',
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toISOString()
          }
        })
      }
    }
  } else if (otpEndpoints.some(e => pathname.startsWith(e)) && method === 'POST') {
    // OTP: tối đa 5 lần / 10 phút per IP — chống OTP brute-force
    const result = await checkRateLimit(ip, {
      maxRequests: 5,
      windowMs: 10 * 60_000,
      keyPrefix: 'auth-otp'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Quá nhiều lần thử xác thực OTP. Vui lòng thử lại sau.',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: {
          'Retry-After': '600',
          'Content-Type': 'application/json'
        }
      })
    }
  } else if (forgotPasswordEndpoints.some(e => pathname.startsWith(e)) && method === 'POST') {
    // Forgot/reset password: tối đa 3 lần / giờ per IP — chống email flooding và token brute-force
    const result = await checkRateLimit(ip, {
      maxRequests: 3,
      windowMs: 60 * 60_000,
      keyPrefix: 'auth-forgot'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: {
          'Retry-After': '3600',
          'Content-Type': 'application/json'
        }
      })
    }
  } else if (registerEndpoints.some(e => pathname.startsWith(e)) && method === 'POST') {
    // Register: tối đa 5 đăng ký / giờ per IP
    const result = await checkRateLimit(ip, {
      maxRequests: 5,
      windowMs: 60 * 60_000,
      keyPrefix: 'auth-register'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: { 'Retry-After': '3600', 'Content-Type': 'application/json' }
      })
    }
  } else if (uploadEndpoints.some(e => pathname.startsWith(e)) && method === 'POST') {
    // File upload: tối đa 20 lần / giờ per IP
    const result = await checkRateLimit(ip, {
      maxRequests: 20,
      windowMs: 60 * 60_000,
      keyPrefix: 'file-upload'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Quá nhiều yêu cầu upload file. Vui lòng thử lại sau.',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: { 'Retry-After': '3600', 'Content-Type': 'application/json' }
      })
    }
  } else if (heavyGetEndpoints.some(e => pathname.startsWith(e)) && method === 'GET') {
    // CPU-intensive GET endpoints: tối đa 10 / phút per IP — chống scraping & DoS
    const result = await checkRateLimit(ip, {
      maxRequests: 10,
      windowMs: 60_000,
      keyPrefix: 'api-heavy-get'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toISOString()
        }
      })
    }
  } else if (generalApiWrite && pathname.startsWith('/api/')) {
    // API write operations chung: tối đa 120 / phút per IP
    const result = await checkRateLimit(ip, {
      maxRequests: 120,
      windowMs: 60_000,
      keyPrefix: 'api-write'
    })
    if (result.limited) {
      return new NextResponse(JSON.stringify({
        error: 'Too Many Requests',
        remaining: result.remaining,
        resetAt: result.resetAt
      }), {
        status: 429,
        headers: {
          'Retry-After': '60',
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toISOString()
        }
      })
    }
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('reason', 'no_token')
      return addSecurityHeaders(NextResponse.redirect(loginUrl), pathname)
    }

    const payload = await verifyTokenEdge(token)
    if (!payload) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('reason', 'invalid_token')
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth-token')
      return addSecurityHeaders(response, pathname)
    }

    // Role-based access control
    if (pathname.startsWith('/dashboard/')) {
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const defaultDashboard = getDefaultDashboard(payload.role)
        return addSecurityHeaders(NextResponse.redirect(new URL(defaultDashboard, request.url)), pathname)
      }

      for (const [path, allowedRoles] of Object.entries(dashboardAccessControl)) {
        if (pathname.startsWith(path)) {
          if (!hasAccess(payload.role, allowedRoles)) {
            const defaultDashboard = getDefaultDashboard(payload.role)
            const redirectUrl = new URL(defaultDashboard, request.url)
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('attempted', pathname)
            return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
          }
          break
        }
      }
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.uid)
    requestHeaders.set('x-user-role', payload.role)
    requestHeaders.set('x-user-email', payload.email)
    // Encode fullName using encodeURIComponent to handle Unicode characters
    requestHeaders.set('x-user-fullname', encodeURIComponent(payload.fullName))

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    return addSecurityHeaders(response, pathname)
  }

  // ✅ Thêm security headers cho tất cả response
  return addSecurityHeaders(NextResponse.next(), pathname)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*', 
    '/profile/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)', // Apply to all routes except static files
  ]
}

