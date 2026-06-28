#!/usr/bin/env bash
# ============================================================================
# setup.sh — Cài đặt TỰ ĐỘNG Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)
# ----------------------------------------------------------------------------
# Một lệnh để: cấu hình môi trường → cài deps → tạo DB → đồng bộ schema → seed
# → (tùy chọn) build + pm2 → kiểm tra sức khỏe.
#
# Chạy nhanh:   bash setup.sh
# Production:   bash setup.sh --with-build --with-pm2
# Air-gap:      bash setup.sh --offline --with-pm2     (gọi từ offline-install.sh)
#
# Cờ:
#   --with-build         Chạy `npm run build` (production).
#   --with-pm2           Khởi động qua pm2 (app: tapchi-ntqs) + pm2 save.
#   --skip-seed          Bỏ qua bước seed dữ liệu.
#   --seed=full|minimal  Chọn sẵn mức seed (không hỏi).
#   --offline            Chế độ air-gap: bỏ npm install/network, dùng bundle sẵn,
#                        cấu hình môi trường theo hồ sơ --airgap.
#   --non-interactive    Không hỏi gì (đọc cấu hình từ biến môi trường).
#   --force              Ghi đè .env nếu đã tồn tại.
#   -h, --help           In trợ giúp.
# ============================================================================
set -euo pipefail

# ── Màu & log ─────────────────────────────────────────────────────────────────
if [ -t 1 ]; then C_G=$'\e[32m'; C_Y=$'\e[33m'; C_R=$'\e[31m'; C_B=$'\e[36m'; C_0=$'\e[0m'; else C_G=; C_Y=; C_R=; C_B=; C_0=; fi
log()  { printf '%s\n' "${C_B}▶ $*${C_0}"; }
ok()   { printf '%s\n' "${C_G}✓ $*${C_0}"; }
warn() { printf '%s\n' "${C_Y}⚠ $*${C_0}"; }
die()  { printf '%s\n' "${C_R}✗ $*${C_0}" >&2; exit 1; }

# ── Cờ ────────────────────────────────────────────────────────────────────────
WITH_BUILD=0; WITH_PM2=0; SKIP_SEED=0; SEED_MODE=""; OFFLINE=0; NONINT=0; FORCE=0
for arg in "$@"; do
  case "$arg" in
    --with-build) WITH_BUILD=1 ;;
    --with-pm2) WITH_PM2=1 ;;
    --skip-seed) SKIP_SEED=1 ;;
    --seed=full) SEED_MODE=full ;;
    --seed=minimal) SEED_MODE=minimal ;;
    --offline) OFFLINE=1 ;;
    --non-interactive) NONINT=1 ;;
    --force) FORCE=1 ;;
    -h|--help) grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Cờ không hợp lệ: $arg (xem --help)" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CÀI ĐẶT TỰ ĐỘNG — Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
[ "$OFFLINE" = 1 ] && warn "Chế độ OFFLINE (air-gap): không dùng mạng."

run_prisma() { if [ -x node_modules/.bin/prisma ]; then node_modules/.bin/prisma "$@"; else npx --no-install prisma "$@"; fi; }

# ── 1) Preflight ──────────────────────────────────────────────────────────────
log "1/9 Kiểm tra môi trường"
command -v node >/dev/null 2>&1 || die "Chưa có Node.js. Cần Node >= 18 (khuyến nghị 20)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node quá cũ ($(node -v)). Cần >= 18."
command -v npm >/dev/null 2>&1 || die "Chưa có npm."
if [ "$OFFLINE" = 1 ]; then
  ARCH="$(uname -m)"; [ "$ARCH" = "x86_64" ] || warn "Arch hiện tại '$ARCH' khác x86_64 — gói build cho x64 có thể không chạy."
  [ -d node_modules ] || die "Offline nhưng thiếu node_modules (gói chưa đầy đủ)."
fi
HAS_PSQL=0; command -v psql >/dev/null 2>&1 && HAS_PSQL=1
ok "Node $(node -v), npm $(npm -v)$([ $HAS_PSQL = 1 ] && echo ', psql sẵn sàng')"

# ── 2) Cấu hình môi trường (HỎI người dùng) ───────────────────────────────────
log "2/9 Cấu hình môi trường (.env)"
ENV_FLAGS=()
[ "$OFFLINE" = 1 ] && ENV_FLAGS+=(--airgap)
[ "$FORCE" = 1 ] && ENV_FLAGS+=(--force)
[ "$NONINT" = 1 ] && ENV_FLAGS+=(--non-interactive)
# configure-env tự xử lý trường hợp .env đã tồn tại (hỏi ghi đè / --force).
node scripts/setup/configure-env.mjs "${ENV_FLAGS[@]}"
[ -f .env ] || die "Thiếu .env sau bước cấu hình."

# Nạp DATABASE_URL + PORT từ .env
DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d'=' -f2- | sed 's/^"//; s/"$//')"
APP_PORT="$(grep -E '^PORT=' .env | head -1 | cut -d'=' -f2- | sed 's/^"//; s/"$//')"; APP_PORT="${APP_PORT:-3001}"
[ -n "$DATABASE_URL" ] || die "Không đọc được DATABASE_URL trong .env."
PSQL_CONN="${DATABASE_URL%%\?*}"   # bỏ ?schema=public cho psql (libpq không hiểu tham số này)

# ── 3) Cài dependencies ───────────────────────────────────────────────────────
log "3/9 Cài đặt dependencies"
if [ "$OFFLINE" = 1 ]; then
  ok "Bỏ qua npm install (offline, dùng node_modules bundled)."
else
  if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi
  ok "Đã cài dependencies."
fi

# ── 4) Prisma generate ────────────────────────────────────────────────────────
log "4/9 Sinh Prisma Client"
run_prisma generate
ok "Đã generate Prisma Client."

# ── 5) Tạo DB + user (nếu được yêu cầu tự tạo) ────────────────────────────────
log "5/9 Tạo database + user (nếu cần)"
if [ -f .db-admin.tmp ]; then
  [ "$HAS_PSQL" = 1 ] || die "Cần psql để tự tạo DB nhưng không tìm thấy. Cài postgresql-client hoặc tạo DB tay rồi chạy lại với DB sẵn có."
  getcfg() { grep -E "^$1=" .db-admin.tmp | head -1 | cut -d'=' -f2-; }
  DB_HOST="$(getcfg DB_HOST)"; DB_PORT="$(getcfg DB_PORT)"; DB_NAME="$(getcfg DB_NAME)"
  DB_USER="$(getcfg DB_USER)"; DB_PASSWORD="$(getcfg DB_PASSWORD)"
  PGADMIN_USER="$(getcfg PGADMIN_USER)"; PGADMIN_PASSWORD="$(getcfg PGADMIN_PASSWORD)"
  DB_PASSWORD_ESC="${DB_PASSWORD//\'/\'\'}"

  # Chọn phương thức kết nối admin theo thứ tự ưu tiên:
  #   pwd   → có mật khẩu admin qua TCP (online điển hình)
  #   peer  → sudo -u postgres (PostgreSQL mới cài trên Ubuntu, không mật khẩu)
  #   trust → TCP không mật khẩu (pg_hba=trust)
  ADMIN_METHOD=""
  if [ -n "$PGADMIN_PASSWORD" ] && PGPASSWORD="$PGADMIN_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGADMIN_USER" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
    ADMIN_METHOD=pwd
  elif command -v sudo >/dev/null 2>&1 && sudo -n -u postgres psql -p "$DB_PORT" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
    ADMIN_METHOD=peer
  elif psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGADMIN_USER" -d postgres -tAc 'SELECT 1' >/dev/null 2>&1; then
    ADMIN_METHOD=trust
  fi
  if [ -z "$ADMIN_METHOD" ]; then
    warn "Không kết nối được PostgreSQL bằng quyền admin (đã thử mật khẩu / peer / trust)."
    warn "Hãy tạo DB tay rồi chạy lại (chọn 'DB đã có'):"
    echo  "   CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '...'; CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
    die  "Dừng vì không tạo được DB tự động."
  fi
  log "   • Phương thức admin: $ADMIN_METHOD"

  # Chạy SQL với quyền admin trên database $1.
  admin_sql() {
    local db="$1"; shift
    case "$ADMIN_METHOD" in
      pwd)   PGPASSWORD="$PGADMIN_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGADMIN_USER" -d "$db" -v ON_ERROR_STOP=1 -q "$@" ;;
      peer)  sudo -u postgres psql -p "$DB_PORT" -d "$db" -v ON_ERROR_STOP=1 -q "$@" ;;
      trust) psql -h "$DB_HOST" -p "$DB_PORT" -U "$PGADMIN_USER" -d "$db" -v ON_ERROR_STOP=1 -q "$@" ;;
    esac
  }

  admin_sql postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASSWORD_ESC}'; END IF; END \$\$;"
  if ! admin_sql postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    admin_sql postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
    ok "Đã tạo database \"$DB_NAME\"."
  else
    warn "Database \"$DB_NAME\" đã tồn tại — dùng lại."
  fi
  admin_sql postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"
  admin_sql "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO \"${DB_USER}\";" || true
  admin_sql "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;" || warn "Không tạo được extension (cần superuser) — FTS có thể hạn chế."
  rm -f .db-admin.tmp
  ok "Hoàn tất tạo DB + user (đã xóa .db-admin.tmp)."
else
  warn "Không có .db-admin.tmp → giả định DB đã tồn tại theo DATABASE_URL."
fi

# ── 6) Đồng bộ schema + vá SQL idempotent ─────────────────────────────────────
log "6/9 Đồng bộ schema (prisma db push) + vá SQL"
run_prisma db push --skip-generate
if [ "$HAS_PSQL" = 1 ]; then
  apply_sql() { [ -f "$1" ] || return 0; log "   • áp dụng $1"; psql "$PSQL_CONN" -v ON_ERROR_STOP=0 -q -f "$1" >/dev/null 2>&1 || warn "     (một số câu trong $1 có thể đã áp dụng trước đó)"; }
  shopt -s nullglob
  for f in prisma/manual/*.sql; do apply_sql "$f"; done
  apply_sql prisma/fts_setup.sql
  for f in prisma/sql/*.sql; do apply_sql "$f"; done
  apply_sql prisma/migrations/add_chat_and_comments.sql
  shopt -u nullglob
  ok "Đã áp dụng các vá SQL idempotent."
else
  warn "Thiếu psql → bỏ qua vá SQL thủ công (FTS/podcast/plagiarism có thể thiếu cột)."
fi

# ── 7) Thư mục upload ─────────────────────────────────────────────────────────
log "7/9 Tạo thư mục upload"
mkdir -p \
  public/uploads/images/{articles,users,banners,issues} \
  public/uploads/documents/{manuscripts,reviews,issues} \
  public/uploads/videos/{uploads,gallery} \
  public/uploads/podcasts/{audio,covers} \
  public/uploads/temp
ok "Đã tạo cây thư mục public/uploads/."

# ── 8) Seed dữ liệu ───────────────────────────────────────────────────────────
log "8/9 Seed dữ liệu"
if [ "$SKIP_SEED" = 1 ]; then
  warn "Bỏ qua seed (--skip-seed)."
else
  MODE="$SEED_MODE"
  if [ -z "$MODE" ]; then
    if [ "$NONINT" = 1 ] || [ ! -t 0 ]; then
      MODE=full
    else
      read -rp "Mức seed dữ liệu — 'full' (đầy đủ demo) hay 'minimal' (tối thiểu/sạch)? [full]: " ans
      MODE="${ans:-full}"
    fi
  fi
  [ "$MODE" = "minimal" ] || MODE=full
  npm run setup:seed -- --mode="$MODE"
  ok "Đã seed ($MODE)."
fi

# ── 9) Build + pm2 + health ───────────────────────────────────────────────────
log "9/9 Build / khởi động / kiểm tra"
NEED_BUILD=0
[ "$WITH_BUILD" = 1 ] && NEED_BUILD=1
# Production qua pm2 cần có .next; nếu chưa build và không offline → build.
if [ "$WITH_PM2" = 1 ] && [ ! -d .next ] && [ "$OFFLINE" != 1 ]; then NEED_BUILD=1; fi
if [ "$NEED_BUILD" = 1 ]; then
  log "   • npm run build"
  npm run build
  ok "Đã build production."
fi

if [ "$WITH_PM2" = 1 ]; then
  PM2=""
  if command -v pm2 >/dev/null 2>&1; then PM2=pm2
  elif [ -x node_modules/.bin/pm2 ]; then PM2="node_modules/.bin/pm2"
  elif [ "$OFFLINE" != 1 ]; then npm install -g pm2 >/dev/null 2>&1 && PM2=pm2 || PM2=""
  fi
  if [ -n "$PM2" ]; then
    $PM2 delete tapchi-ntqs >/dev/null 2>&1 || true
    $PM2 start npm --name tapchi-ntqs -- start
    $PM2 save >/dev/null 2>&1 || true
    ok "Đã khởi động pm2 app 'tapchi-ntqs'. (Bật autostart: '$PM2 startup' rồi '$PM2 save')"
  else
    warn "Không có pm2 (offline). Khởi động nền bằng nohup → log: ntqs.out.log"
    nohup npm start >ntqs.out.log 2>&1 &
  fi

  # Health check best-effort
  log "   • Kiểm tra /api/health (tối đa ~40s)"
  HEALTH_URL="http://localhost:${APP_PORT}/api/health"
  for i in $(seq 1 20); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then ok "Server khỏe: $HEALTH_URL"; break; fi
    sleep 2
    [ "$i" = 20 ] && warn "Chưa thấy server khỏe sau ~40s — kiểm tra log."
  done
fi

# ── Tổng kết ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ CÀI ĐẶT HOÀN TẤT                                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  • URL:        http://localhost:${APP_PORT}/"
echo "  • Đăng nhập:  admin@tapchintqsvn.edu.vn  /  TapChi@2025"
if [ "$WITH_PM2" != 1 ]; then
  echo "  • Chạy dev:   npm run dev        (rồi mở http://localhost:${APP_PORT})"
  echo "  • Chạy prod:  bash setup.sh --with-build --with-pm2"
fi
echo ""
