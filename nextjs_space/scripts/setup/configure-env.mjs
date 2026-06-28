/**
 * configure-env.mjs — Trợ lý cấu hình môi trường cho Tạp chí NTQS.
 *
 * Viết bằng ESM JavaScript thuần (chỉ dùng built-in của Node) để chạy được NGAY
 * bằng `node` mà KHÔNG cần cài dependency trước — nhờ vậy có thể HỎI cấu hình ở
 * bước đầu tiên của setup.sh (trước cả npm install).
 *
 * Nhiệm vụ:
 *   - HỎI người dùng các giá trị cấu hình hệ thống cần khai báo (kết nối DB,
 *     URL ứng dụng, cổng, bật/tắt dịch vụ ngoài).
 *   - TỰ SINH toàn bộ secret an toàn (NEXTAUTH/JWT/ORCID/CRON) bằng crypto.
 *   - Ghi ra file `.env` hoàn chỉnh.
 *   - Ghi `.db-admin.tmp` (chmod 600) để setup.sh TẠO DB + user rồi xóa ngay.
 *     Admin creds KHÔNG được ghi vào `.env`.
 *
 * Cờ:
 *   --airgap          Hồ sơ máy chủ kín: TẮT mọi dịch vụ internet, hỏi host nội bộ.
 *   --force           Ghi đè .env nếu đã tồn tại (không hỏi).
 *   --non-interactive Không hỏi; đọc toàn bộ từ biến môi trường (CI/offline).
 *
 * Chạy: node scripts/setup/configure-env.mjs [--airgap] [--force] [--non-interactive]
 */
import { randomBytes } from 'node:crypto'
import { existsSync, writeFileSync, chmodSync } from 'node:fs'
import { resolve } from 'node:path'
import { networkInterfaces } from 'node:os'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const ARGV = process.argv.slice(2)
const AIRGAP = ARGV.includes('--airgap')
const FORCE = ARGV.includes('--force')
const NON_INTERACTIVE = ARGV.includes('--non-interactive') || !input.isTTY

const ENV_PATH = resolve(process.cwd(), '.env')
const DB_ADMIN_TMP = resolve(process.cwd(), '.db-admin.tmp')

// ── Tiện ích sinh secret ──────────────────────────────────────────────────────
const secretBase64 = () => randomBytes(32).toString('base64')
const secretHex = () => randomBytes(32).toString('hex')

/** Lấy IP LAN đầu tiên (ưu tiên cho hồ sơ air-gap để đặt URL nội bộ). */
function detectLanIp() {
  const ifaces = networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost'
}

// ── Lớp hỏi/đáp (tôn trọng non-interactive + giá trị mặc định) ─────────────────
/** @type {readline.Interface | null} */
let rl = null

async function ask(question, def, envKey) {
  if (NON_INTERACTIVE) {
    const fromEnv = envKey ? process.env[envKey] : undefined
    return (fromEnv && fromEnv.trim()) || def
  }
  rl ??= readline.createInterface({ input, output })
  const suffix = def ? ` [${def}]` : ''
  const answer = (await rl.question(`${question}${suffix}: `)).trim()
  return answer || def
}

async function askYesNo(question, def, envKey) {
  const defStr = def ? 'Y/n' : 'y/N'
  if (NON_INTERACTIVE) {
    const fromEnv = envKey ? process.env[envKey] : undefined
    if (fromEnv != null) return /^(1|true|y|yes)$/i.test(fromEnv.trim())
    return def
  }
  rl ??= readline.createInterface({ input, output })
  const answer = (await rl.question(`${question} (${defStr}): `)).trim().toLowerCase()
  if (!answer) return def
  return /^(y|yes)$/.test(answer)
}

function buildDatabaseUrl(db) {
  const pwd = encodeURIComponent(db.password)
  const user = encodeURIComponent(db.user)
  return `postgresql://${user}:${pwd}@${db.host}:${db.port}/${db.name}?schema=public`
}

/** Soạn nội dung file .env hoàn chỉnh từ cấu hình + secret đã sinh. */
function composeEnv(opts) {
  const s = {
    NEXTAUTH_SECRET: secretBase64(),
    JWT_SECRET: secretBase64(),
    JWT_REFRESH_SECRET: secretBase64(),
    ORCID_ENCRYPTION_KEY: secretHex(),
    CRON_SECRET: secretHex(),
  }
  const L = []
  L.push('# File .env do scripts/setup/configure-env.mjs sinh tự động.')
  L.push(`# Sinh lúc: ${new Date().toISOString()}${AIRGAP ? ' (hồ sơ air-gap)' : ''}`)
  L.push('# KHÔNG commit file này. Secret đã được sinh ngẫu nhiên.')
  L.push('')
  L.push('# ===== DATABASE =====')
  L.push(`DATABASE_URL="${opts.databaseUrl}"`)
  L.push('')
  L.push('# ===== AUTH & URL =====')
  L.push(`NEXTAUTH_URL="${opts.appUrl}"`)
  L.push(`NEXT_PUBLIC_APP_URL="${opts.appUrl}"`)
  L.push(`NEXTAUTH_SECRET="${s.NEXTAUTH_SECRET}"`)
  L.push(`JWT_SECRET="${s.JWT_SECRET}"`)
  L.push(`JWT_REFRESH_SECRET="${s.JWT_REFRESH_SECRET}"`)
  L.push(`ORCID_ENCRYPTION_KEY="${s.ORCID_ENCRYPTION_KEY}"`)
  L.push(`CRON_SECRET="${s.CRON_SECRET}"`)
  L.push('')
  L.push('# ===== STORAGE =====')
  L.push(`USE_AWS="${opts.useAws ? 'true' : 'false'}"`)
  L.push('UPLOAD_ROOT="./public/uploads"')
  L.push('MAX_VIDEO_UPLOAD_MB="0"')
  if (opts.useAws) {
    L.push('AWS_REGION="us-west-2"')
    L.push('AWS_BUCKET_NAME=""')
    L.push('AWS_FOLDER_PREFIX=""')
  }
  L.push('')
  L.push('# ===== SYSTEM =====')
  L.push(`NODE_ENV="${opts.nodeEnv}"`)
  L.push(`PORT="${opts.port}"`)
  L.push('PRISMA_LOG_QUERIES="false"')
  L.push('DEBUG="false"')
  L.push('')
  L.push('# ===== INTEGRATIONS (internet) — TẮT mặc định =====')
  L.push('ORCID_SANDBOX="true"')
  L.push('CROSSREF_TEST_MODE="true"')
  L.push('ITHENTICATE_ENABLED="false"')
  L.push('')
  L.push('# ===== SMTP =====')
  L.push(`SMTP_ENABLED="${opts.smtp.enabled ? 'true' : 'false'}"`)
  if (opts.smtp.enabled) {
    L.push(`SMTP_HOST="${opts.smtp.host}"`)
    L.push(`SMTP_PORT="${opts.smtp.port}"`)
    L.push(`SMTP_USER="${opts.smtp.user}"`)
    L.push(`SMTP_PASS="${opts.smtp.pass}"`)
    L.push(`SMTP_FROM_NAME="${opts.smtp.fromName}"`)
    L.push(`SMTP_FROM_EMAIL="${opts.smtp.fromEmail}"`)
  }
  if (opts.redis.enabled) {
    L.push('')
    L.push('# ===== REDIS (Upstash) =====')
    L.push(`UPSTASH_REDIS_REST_URL="${opts.redis.url}"`)
    L.push(`UPSTASH_REDIS_REST_TOKEN="${opts.redis.token}"`)
  }
  L.push('')
  return L.join('\n')
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  CẤU HÌNH MÔI TRƯỜNG — Tạp chí Nghệ thuật Quân sự Việt Nam     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  if (AIRGAP) console.log('🔒 Hồ sơ AIR-GAP: mọi dịch vụ internet sẽ bị TẮT.')

  if (existsSync(ENV_PATH) && !FORCE) {
    const overwrite = await askYesNo('⚠️  Đã tồn tại file .env. Ghi đè?', false, 'ENV_OVERWRITE')
    if (!overwrite) {
      console.log('→ Giữ nguyên .env hiện tại. Bỏ qua bước cấu hình.')
      rl?.close()
      return
    }
  }

  // 1) Database ứng dụng
  console.log('\n── 1) Kết nối PostgreSQL (ứng dụng) ──')
  const db = {
    host: await ask('Host DB', 'localhost', 'DB_HOST'),
    port: await ask('Port DB', '5432', 'DB_PORT'),
    name: await ask('Tên DB', 'tapchi_ntqs', 'DB_NAME'),
    user: await ask('User DB (ứng dụng)', 'tapchi_ntqs', 'DB_USER'),
    password: '',
  }
  db.password = await ask('Mật khẩu user DB (Enter để tự sinh)', '', 'DB_PASSWORD')
  if (!db.password) {
    db.password = randomBytes(12).toString('base64url')
    console.log(`   → Đã tự sinh mật khẩu DB: ${db.password}`)
  }

  // 2) Admin postgres (để tự tạo DB + user)
  console.log('\n── 2) Quyền admin PostgreSQL (để TỰ TẠO DB + user) ──')
  const admin = { enabled: false, user: 'postgres', password: '' }
  admin.enabled = await askYesNo('Cho installer tự tạo DB + user?', true, 'DB_AUTOCREATE')
  if (admin.enabled) {
    admin.user = await ask('User admin postgres', 'postgres', 'PGADMIN_USER')
    admin.password = await ask('Mật khẩu admin postgres (Enter nếu peer/trust local)', '', 'PGADMIN_PASSWORD')
  }

  // 3) URL ứng dụng + cổng
  console.log('\n── 3) URL ứng dụng ──')
  const port = await ask('Cổng chạy app', '3001', 'PORT')
  const defaultHost = AIRGAP ? detectLanIp() : 'localhost'
  const appUrl = await ask('URL truy cập (NEXTAUTH_URL)', `http://${defaultHost}:${port}`, 'APP_URL')
  const nodeEnv = await ask('NODE_ENV', AIRGAP ? 'production' : 'development', 'NODE_ENV')

  // 4) Dịch vụ ngoài (bỏ qua khi air-gap)
  let useAws = false
  const smtp = { enabled: false, host: '', port: '587', user: '', pass: '', fromName: 'Tạp chí Nghệ thuật Quân sự Việt Nam', fromEmail: 'tapchintqsvn@gmail.com' }
  const redis = { enabled: false, url: '', token: '' }
  if (!AIRGAP) {
    console.log('\n── 4) Dịch vụ ngoài (tùy chọn) ──')
    useAws = await askYesNo('Dùng AWS S3 cho lưu trữ? (mặc định lưu local)', false, 'USE_AWS')
    smtp.enabled = await askYesNo('Bật gửi email SMTP?', false, 'SMTP_ENABLED')
    if (smtp.enabled) {
      smtp.host = await ask('SMTP host', '', 'SMTP_HOST')
      smtp.port = await ask('SMTP port', '587', 'SMTP_PORT')
      smtp.user = await ask('SMTP user', '', 'SMTP_USER')
      smtp.pass = await ask('SMTP pass', '', 'SMTP_PASS')
      smtp.fromEmail = await ask('Email gửi đi', smtp.fromEmail, 'SMTP_FROM_EMAIL')
    }
    redis.enabled = await askYesNo('Dùng Redis/Upstash cho rate-limit? (mặc định in-memory)', false, 'REDIS_ENABLED')
    if (redis.enabled) {
      redis.url = await ask('UPSTASH_REDIS_REST_URL', '', 'UPSTASH_REDIS_REST_URL')
      redis.token = await ask('UPSTASH_REDIS_REST_TOKEN', '', 'UPSTASH_REDIS_REST_TOKEN')
    }
  } else {
    console.log('\n── 4) Dịch vụ ngoài: BỎ QUA (air-gap, lưu local + rate-limit in-memory) ──')
  }

  // 5) Soạn & ghi .env
  const databaseUrl = buildDatabaseUrl(db)
  const envContent = composeEnv({ databaseUrl, appUrl, port, nodeEnv, useAws, smtp, redis })
  writeFileSync(ENV_PATH, envContent, { encoding: 'utf8' })
  try { chmodSync(ENV_PATH, 0o600) } catch { /* hệ thống không hỗ trợ chmod → bỏ qua */ }
  console.log(`\n✅ Đã ghi ${ENV_PATH} (secret tự sinh, quyền 600).`)

  // 6) Ghi .db-admin.tmp cho setup.sh (nếu tự tạo DB)
  if (admin.enabled) {
    const tmp = [
      `DB_HOST=${db.host}`,
      `DB_PORT=${db.port}`,
      `DB_NAME=${db.name}`,
      `DB_USER=${db.user}`,
      `DB_PASSWORD=${db.password}`,
      `PGADMIN_USER=${admin.user}`,
      `PGADMIN_PASSWORD=${admin.password}`,
      '',
    ].join('\n')
    writeFileSync(DB_ADMIN_TMP, tmp, { encoding: 'utf8' })
    try { chmodSync(DB_ADMIN_TMP, 0o600) } catch { /* bỏ qua */ }
    console.log(`✅ Đã ghi ${DB_ADMIN_TMP} (chmod 600) — setup.sh sẽ dùng rồi xóa.`)
  }

  rl?.close()
}

main().catch((e) => {
  console.error('❌ Lỗi cấu hình môi trường:', e)
  rl?.close()
  process.exit(1)
})
