#!/usr/bin/env bash
# ============================================================================
# offline-install.sh — Cài Tạp chí NTQS trên MÁY CHỦ AIR-GAPPED (không internet).
# ----------------------------------------------------------------------------
# Chạy từ GỐC GÓI USB (cùng cấp với runtime/, app/, MANIFEST.txt, SHA256SUMS).
# Tự cài Node + PostgreSQL từ gói, copy app, rồi gọi setup.sh --offline.
#
#   sudo bash offline-install.sh
#
# Cờ:
#   --install-dir <dir>   Thư mục cài app (mặc định /opt/tapchi-ntqs).
#   --seed=full|minimal   Chọn sẵn mức seed (chuyển tiếp cho setup.sh).
#   --skip-verify         Bỏ qua kiểm tra SHA256SUMS.
#   --non-interactive     Không hỏi (chuyển tiếp cho setup.sh).
#   -h, --help            Trợ giúp.
# ============================================================================
set -euo pipefail

if [ -t 1 ]; then C_G=$'\e[32m'; C_Y=$'\e[33m'; C_R=$'\e[31m'; C_B=$'\e[36m'; C_0=$'\e[0m'; else C_G=; C_Y=; C_R=; C_B=; C_0=; fi
log()  { printf '%s\n' "${C_B}▶ $*${C_0}"; }
ok()   { printf '%s\n' "${C_G}✓ $*${C_0}"; }
warn() { printf '%s\n' "${C_Y}⚠ $*${C_0}"; }
die()  { printf '%s\n' "${C_R}✗ $*${C_0}" >&2; exit 1; }

INSTALL_DIR="/opt/tapchi-ntqs"; SEED_FLAG=""; SKIP_VERIFY=0; NONINT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    --seed=full) SEED_FLAG="--seed=full"; shift ;;
    --seed=minimal) SEED_FLAG="--seed=minimal"; shift ;;
    --skip-verify) SKIP_VERIFY=1; shift ;;
    --non-interactive) NONINT=1; shift ;;
    -h|--help) grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Cờ không hợp lệ: $1 (xem --help)" ;;
  esac
done

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BUNDLE_DIR"
export PATH="/usr/local/bin:$PATH"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CÀI ĐẶT OFFLINE (AIR-GAP) — Tạp chí NTQS                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ── 0) Preflight ──────────────────────────────────────────────────────────────
[ "$(id -u)" = "0" ] || die "Cần chạy bằng root (sudo) để cài Node + PostgreSQL."
[ "$(uname -m)" = "x86_64" ] || die "Gói build cho x86_64; máy hiện tại là $(uname -m)."
[ -d app ] || die "Thiếu thư mục app/ — gói USB không hợp lệ."
[ -f MANIFEST.txt ] && { echo "── MANIFEST ──"; cat MANIFEST.txt; echo "──────────────"; }

# ── 1) Kiểm checksum ──────────────────────────────────────────────────────────
if [ "$SKIP_VERIFY" != 1 ] && [ -f SHA256SUMS ]; then
  log "1) Kiểm tra toàn vẹn (SHA256SUMS)"
  sha256sum -c SHA256SUMS || die "Checksum KHÔNG khớp — gói có thể hỏng. (Bỏ qua bằng --skip-verify nếu chắc chắn.)"
  ok "Checksum khớp."
else
  warn "Bỏ qua kiểm checksum."
fi

# ── 2) Cài Node (nếu chưa có/quá cũ) ──────────────────────────────────────────
log "2) Node.js runtime"
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  [ "$NODE_MAJOR" -ge 18 ] && NEED_NODE=0
fi
if [ "$NEED_NODE" = 1 ]; then
  NODE_TARBALL="$(find runtime/node -name 'node-*-linux-x64.tar.xz' | head -1)"
  [ -n "$NODE_TARBALL" ] || die "Không tìm thấy tarball Node trong runtime/node."
  command -v xz >/dev/null 2>&1 || command -v unxz >/dev/null 2>&1 || die "Thiếu xz-utils để giải nén Node."
  log "   • Giải nén $NODE_TARBALL → /usr/local"
  tar -xJf "$NODE_TARBALL" -C /usr/local --strip-components=1
  ok "Đã cài Node $(node -v)."
else
  ok "Đã có Node $(node -v) (>=18) — dùng lại."
fi

# ── 3) Cài PostgreSQL (nếu chưa có) ───────────────────────────────────────────
log "3) PostgreSQL"
if dpkg -s postgresql >/dev/null 2>&1; then
  ok "PostgreSQL đã cài — dùng lại."
else
  DEB_DIR="runtime/postgres-debs"
  if [ -d "$DEB_DIR" ] && ls "$DEB_DIR"/*.deb >/dev/null 2>&1; then
    log "   • Cài từ .deb (dpkg)"
    # Chạy dpkg 2 lần để tự xử lý thứ tự phụ thuộc (mọi .deb đều có sẵn trong thư mục).
    dpkg -i "$DEB_DIR"/*.deb >/dev/null 2>&1 || dpkg -i "$DEB_DIR"/*.deb || die "Cài PostgreSQL từ .deb thất bại (thiếu phụ thuộc?). Kiểm tra MANIFEST/Ubuntu codename."
    ok "Đã cài PostgreSQL."
  else
    die "Thiếu .deb PostgreSQL trong gói và máy chủ chưa có PostgreSQL."
  fi
fi
# Khởi động dịch vụ (systemd → service → pg_ctlcluster)
log "   • Đảm bảo dịch vụ PostgreSQL đang chạy"
( systemctl enable --now postgresql >/dev/null 2>&1 ) \
  || ( service postgresql start >/dev/null 2>&1 ) \
  || ( command -v pg_ctlcluster >/dev/null 2>&1 && pg_ctlcluster "$(pg_lsclusters -h 2>/dev/null | awk 'NR==1{print $1}')" main start >/dev/null 2>&1 ) \
  || warn "Không tự khởi động được PostgreSQL — hãy bật dịch vụ thủ công."
sleep 2
ok "PostgreSQL sẵn sàng."

# ── 4) Copy app vào INSTALL_DIR ───────────────────────────────────────────────
log "4) Triển khai app → $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -a app/. "$INSTALL_DIR"/
ok "Đã copy app."

# ── 5) Gọi setup.sh ở chế độ offline ──────────────────────────────────────────
log "5) Chạy setup.sh --offline --with-pm2"
cd "$INSTALL_DIR"
EXTRA=()
[ -n "$SEED_FLAG" ] && EXTRA+=("$SEED_FLAG")
[ "$NONINT" = 1 ] && EXTRA+=(--non-interactive)
bash setup.sh --offline --with-pm2 "${EXTRA[@]}"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ CÀI ĐẶT OFFLINE HOÀN TẤT                                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "  • App tại: $INSTALL_DIR"
echo "  • Bật khởi động cùng máy: 'pm2 startup' rồi 'pm2 save' (theo hướng dẫn in ra)."
echo ""
