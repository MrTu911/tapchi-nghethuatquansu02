#!/usr/bin/env bash
# ============================================================================
# build-usb-package.sh — Đóng gói bộ cài OFFLINE (USB) cho máy chủ air-gapped.
# ----------------------------------------------------------------------------
# CHẠY TRÊN MÁY STAGING CÓ INTERNET, khớp Ubuntu/Debian x64 với máy chủ đích.
# Sản phẩm: một tarball tự chứa (Node + PostgreSQL .deb + app build sẵn + seed)
# để cắm USB và cài trên máy chủ TRẮNG, hoàn toàn không cần mạng.
#
# Cờ:
#   --ubuntu-codename <name>  Mã Ubuntu của máy chủ đích (jammy/focal/noble...).
#                             Dùng để tải đúng closure .deb PostgreSQL.
#   --node-version <vX.Y.Z>   Phiên bản Node để bundle (mặc định = node hiện tại).
#   --out <dir>               Thư mục xuất (mặc định: <repo>/ntqs-offline-build).
#   --skip-build              Bỏ qua npm ci + build (dùng lại .next/node_modules).
#   --skip-postgres           Không tải .deb PostgreSQL (máy chủ đã có sẵn PG).
#   -h, --help                Trợ giúp.
# ============================================================================
set -euo pipefail

if [ -t 1 ]; then C_G=$'\e[32m'; C_Y=$'\e[33m'; C_R=$'\e[31m'; C_B=$'\e[36m'; C_0=$'\e[0m'; else C_G=; C_Y=; C_R=; C_B=; C_0=; fi
log()  { printf '%s\n' "${C_B}▶ $*${C_0}"; }
ok()   { printf '%s\n' "${C_G}✓ $*${C_0}"; }
warn() { printf '%s\n' "${C_Y}⚠ $*${C_0}"; }
die()  { printf '%s\n' "${C_R}✗ $*${C_0}" >&2; exit 1; }

UBUNTU_CODENAME=""; NODE_VERSION=""; OUT_DIR=""; SKIP_BUILD=0; SKIP_PG=0
while [ $# -gt 0 ]; do
  case "$1" in
    --ubuntu-codename) UBUNTU_CODENAME="$2"; shift 2 ;;
    --node-version) NODE_VERSION="$2"; shift 2 ;;
    --out) OUT_DIR="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-postgres) SKIP_PG=1; shift ;;
    -h|--help) grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Cờ không hợp lệ: $1 (xem --help)" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"        # nextjs_space
REPO_DIR="$(cd "$APP_DIR/.." && pwd)"
cd "$APP_DIR"

[ -z "$OUT_DIR" ] && OUT_DIR="$REPO_DIR/ntqs-offline-build"
NODE_VERSION="${NODE_VERSION:-$(node -v)}"        # vd v20.20.0
STAMP="$(date +%Y%m%d-%H%M%S)"
BUNDLE="$OUT_DIR/bundle"
APP_VER="$(node -p "require('./package.json').version || '0.0.0'" 2>/dev/null || echo 0.0.0)"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ĐÓNG GÓI USB OFFLINE — Tạp chí NTQS                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ── Preflight ─────────────────────────────────────────────────────────────────
log "Kiểm tra môi trường staging"
[ "$(uname -m)" = "x86_64" ] || warn "Staging không phải x86_64 — gói có thể không chạy trên máy chủ x64."
command -v npm >/dev/null 2>&1 || die "Thiếu npm."
command -v rsync >/dev/null 2>&1 || die "Thiếu rsync (cần để copy app gọn gàng)."
command -v curl >/dev/null 2>&1 || die "Thiếu curl (cần để tải Node)."
command -v sha256sum >/dev/null 2>&1 || die "Thiếu sha256sum."
ok "Node $(node -v), npm $(npm -v)"

rm -rf "$BUNDLE"
mkdir -p "$BUNDLE/app" "$BUNDLE/runtime/node" "$BUNDLE/runtime/postgres-debs"

# ── 1) Build app (full deps, prisma generate, next build) ─────────────────────
if [ "$SKIP_BUILD" = 1 ]; then
  warn "Bỏ qua build (dùng lại .next/node_modules hiện có)."
  [ -d node_modules ] || die "Thiếu node_modules nhưng --skip-build."
  [ -d .next ] || die "Thiếu .next nhưng --skip-build."
else
  log "1) Cài deps đầy đủ + generate + build production"
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
  npx --no-install prisma generate
  npm run build
  ok "Đã build .next production."
fi

# ── 2) Tải Node runtime ───────────────────────────────────────────────────────
log "2) Tải Node $NODE_VERSION (linux-x64)"
NODE_TARBALL="node-${NODE_VERSION}-linux-x64.tar.xz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TARBALL}"
curl -fSL "$NODE_URL" -o "$BUNDLE/runtime/node/${NODE_TARBALL}" || die "Không tải được Node từ $NODE_URL"
ok "Đã tải $NODE_TARBALL"

# ── 3) Tải PostgreSQL .deb closure ────────────────────────────────────────────
if [ "$SKIP_PG" = 1 ]; then
  warn "Bỏ qua tải PostgreSQL (--skip-postgres)."
else
  log "3) Tải closure .deb PostgreSQL"
  if command -v docker >/dev/null 2>&1 && [ -n "$UBUNTU_CODENAME" ]; then
    log "   • Dùng Docker ubuntu:${UBUNTU_CODENAME} để lấy closure chính xác"
    docker run --rm -v "$BUNDLE/runtime/postgres-debs:/debs" "ubuntu:${UBUNTU_CODENAME}" bash -c '
      set -e
      apt-get update
      apt-get install -y --download-only -o Dir::Cache::archives=/debs postgresql postgresql-contrib
      chmod -R a+rw /debs || true
    ' || die "Tải .deb trong Docker thất bại."
    rm -rf "$BUNDLE/runtime/postgres-debs/partial"
  else
    warn "Không có Docker hoặc thiếu --ubuntu-codename → tải .deb trực tiếp trên staging."
    warn "  (Chỉ đầy đủ nếu staging cùng release với máy chủ đích và CHƯA cài sẵn postgres.)"
    sudo apt-get update
    sudo apt-get install -y --download-only -o Dir::Cache::archives="$BUNDLE/runtime/postgres-debs" postgresql postgresql-contrib || \
      die "Tải .deb thất bại. Hãy chạy lại với Docker + --ubuntu-codename."
    rm -rf "$BUNDLE/runtime/postgres-debs/partial"
    sudo chown -R "$(id -u):$(id -g)" "$BUNDLE/runtime/postgres-debs" || true
  fi
  DEB_COUNT="$(find "$BUNDLE/runtime/postgres-debs" -name '*.deb' | wc -l | tr -d ' ')"
  [ "$DEB_COUNT" -gt 0 ] || die "Không có .deb nào được tải."
  ok "Đã tải $DEB_COUNT gói .deb PostgreSQL."
fi

# ── 4) Copy app (gọn, loại trừ rác) ───────────────────────────────────────────
log "4) Copy app vào gói (giữ node_modules + .next)"
rsync -a \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.backup*' \
  --exclude '.next/cache' \
  --exclude '*.log' \
  --exclude '.db-admin.tmp' \
  --exclude 'ntqs-offline-build' \
  ./ "$BUNDLE/app/"
ok "Đã copy app."

# ── 5) offline-install.sh + manifest + checksums ──────────────────────────────
log "5) Tạo offline-install.sh + MANIFEST + SHA256SUMS"
cp "$SCRIPT_DIR/offline-install.sh" "$BUNDLE/offline-install.sh"
chmod +x "$BUNDLE/offline-install.sh"

cat > "$BUNDLE/MANIFEST.txt" <<EOF
GÓI CÀI OFFLINE — Tạp chí Nghệ thuật Quân sự Việt Nam (NTQS)
Tạo lúc          : $(date -Iseconds)
App version      : ${APP_VER}
Node bundled     : ${NODE_VERSION} (linux-x64)
Ubuntu đích      : ${UBUNTU_CODENAME:-"(không chỉ định)"}
Arch             : x86_64
PostgreSQL .deb  : $([ "$SKIP_PG" = 1 ] && echo "KHÔNG (dùng PG sẵn có)" || find "$BUNDLE/runtime/postgres-debs" -name '*.deb' | wc -l | tr -d ' ') gói
Thành phần       : app/ (build sẵn + node_modules), runtime/node, runtime/postgres-debs, offline-install.sh
Cài đặt          : sudo bash offline-install.sh
EOF

( cd "$BUNDLE" && find runtime -type f -print0 | xargs -0 sha256sum > SHA256SUMS && \
  sha256sum offline-install.sh MANIFEST.txt >> SHA256SUMS )
ok "Đã ghi MANIFEST.txt + SHA256SUMS."

# ── 6) Đóng tarball ───────────────────────────────────────────────────────────
log "6) Nén gói"
ARCHIVE="$OUT_DIR/ntqs-offline-${STAMP}.tar.gz"
( cd "$BUNDLE" && tar -czf "$ARCHIVE" . )
ARCHIVE_SHA="$(sha256sum "$ARCHIVE" | cut -d' ' -f1)"
SIZE="$(du -h "$ARCHIVE" | cut -f1)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ ĐÓNG GÓI HOÀN TẤT                                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  • Tarball : $ARCHIVE  ($SIZE)"
echo "  • SHA256  : $ARCHIVE_SHA"
echo ""
echo "  Bước tiếp theo:"
echo "   1) Copy '$ARCHIVE' ra USB."
echo "   2) Trên máy chủ air-gapped: giải nén rồi 'sudo bash offline-install.sh'."
echo ""
