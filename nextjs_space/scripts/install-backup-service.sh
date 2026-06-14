#!/bin/bash
# ============================================================
# install-backup-service.sh
# Cài đặt systemd timer cho backup tự động và health check
#
# Cách dùng (với quyền root trên server Linux):
#   sudo ./scripts/install-backup-service.sh
#
# Sau khi cài:
#   - Backup chạy tự động lúc 02:00 hàng ngày
#   - Health check chạy mỗi 5 phút
#   - Log xem bằng: journalctl -u tapchi-backup -u tapchi-health -f
# ============================================================

set -euo pipefail

# ── Kiểm tra quyền root ───────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Script này phải chạy với quyền root (sudo)."
  exit 1
fi

# ── Cấu hình đường dẫn ────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/tapchi"
SYSTEMD_DIR="/etc/systemd/system"
ENV_DIR="/etc/tapchi"
BACKUP_DIR="/var/backups/tapchi"
LOG_DIR="/var/log"

echo "══════════════════════════════════════════════════════"
echo " Tạp chí KHHLQS — Cài đặt Backup & Health Check"
echo "══════════════════════════════════════════════════════"

# ── 1. Copy scripts vào /opt/tapchi ──────────────────────────
echo "[1/6] Copy scripts → $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR/scripts"

for script in backup.sh restore.sh cron-health-check.sh; do
  if [ -f "$SCRIPT_DIR/$script" ]; then
    cp "$SCRIPT_DIR/$script" "$INSTALL_DIR/scripts/$script"
    chmod +x "$INSTALL_DIR/scripts/$script"
    echo "  ✓ $script"
  else
    echo "  ⚠ $script không tìm thấy — bỏ qua"
  fi
done

# ── 2. Tạo file cấu hình env (nếu chưa có) ───────────────────
echo "[2/6] Khởi tạo file cấu hình $ENV_DIR/backup.env ..."
mkdir -p "$ENV_DIR"

if [ ! -f "$ENV_DIR/backup.env" ]; then
  # Thử đọc từ .env.production hoặc .env của project
  PROJECT_ENV=""
  for envfile in "$SCRIPT_DIR/../.env.production" "$SCRIPT_DIR/../.env"; do
    if [ -f "$envfile" ]; then
      PROJECT_ENV="$envfile"
      break
    fi
  done

  cat > "$ENV_DIR/backup.env" << 'EOF'
# Cấu hình backup — chỉnh sửa các giá trị cho phù hợp với server
BACKUP_DIR=/var/backups/tapchi
RETENTION_DAYS=30

# PostgreSQL (native deployment)
POSTGRES_DB=tapchi_prod
POSTGRES_USER=tapchi
POSTGRES_PASSWORD=CHANGE_ME
DB_HOST=localhost
DB_PORT=5432

# Docker (auto-detect nếu container đang chạy)
DOCKER_PG_CONTAINER=tapchi_postgres
DOCKER_UPLOAD_VOLUME=tapchi_uploads_data

# Upload directory (native deployment)
UPLOAD_DIR=/opt/tapchi/public/uploads
EOF

  echo "  ✓ Đã tạo $ENV_DIR/backup.env"
  echo "  ⚠ QUAN TRỌNG: Sửa POSTGRES_PASSWORD trong $ENV_DIR/backup.env trước khi chạy backup!"

  # Sao chép POSTGRES_PASSWORD từ project .env nếu có
  if [ -n "$PROJECT_ENV" ]; then
    PG_PASS=$(grep "^POSTGRES_PASSWORD" "$PROJECT_ENV" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || true)
    if [ -n "$PG_PASS" ]; then
      sed -i "s/POSTGRES_PASSWORD=CHANGE_ME/POSTGRES_PASSWORD=$PG_PASS/" "$ENV_DIR/backup.env"
      echo "  ✓ POSTGRES_PASSWORD tự động từ $PROJECT_ENV"
    fi
  fi
else
  echo "  ✓ $ENV_DIR/backup.env đã tồn tại — giữ nguyên"
fi

# Bảo vệ file env (chỉ root đọc được)
chmod 600 "$ENV_DIR/backup.env"

# ── 3. Tạo thư mục backup và log ─────────────────────────────
echo "[3/6] Tạo thư mục backup $BACKUP_DIR ..."
mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"
chmod 750 "$BACKUP_DIR"
echo "  ✓ $BACKUP_DIR/{db,uploads}"

# ── 4. Cài đặt systemd units ─────────────────────────────────
echo "[4/6] Cài đặt systemd unit files ..."

for unit in tapchi-backup.service tapchi-backup.timer tapchi-health.service tapchi-health.timer; do
  if [ -f "$SCRIPT_DIR/$unit" ]; then
    # Cập nhật đường dẫn ExecStart trong unit file
    sed "s|/opt/tapchi/scripts|$INSTALL_DIR/scripts|g" "$SCRIPT_DIR/$unit" > "$SYSTEMD_DIR/$unit"
    echo "  ✓ $SYSTEMD_DIR/$unit"
  else
    echo "  ⚠ $unit không tìm thấy — bỏ qua"
  fi
done

systemctl daemon-reload
echo "  ✓ systemctl daemon-reload"

# ── 5. Enable và start timers ─────────────────────────────────
echo "[5/6] Enable timers ..."

systemctl enable tapchi-backup.timer
systemctl start tapchi-backup.timer
echo "  ✓ tapchi-backup.timer — backup hàng ngày lúc 02:00"

systemctl enable tapchi-health.timer
systemctl start tapchi-health.timer
echo "  ✓ tapchi-health.timer — health check mỗi 5 phút"

# ── 6. Kiểm tra trạng thái ────────────────────────────────────
echo "[6/6] Kiểm tra trạng thái timers ..."
systemctl status tapchi-backup.timer --no-pager -l 2>&1 | grep -E "(Active|Next|Last)" | sed 's/^/  /'
systemctl status tapchi-health.timer --no-pager -l 2>&1 | grep -E "(Active|Next|Last)" | sed 's/^/  /'

# ── Tổng kết ─────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo " ✓ Cài đặt hoàn thành!"
echo ""
echo " Các lệnh hữu ích:"
echo "   Xem log backup:       journalctl -u tapchi-backup -f"
echo "   Xem log health:       journalctl -u tapchi-health -f"
echo "   Chạy backup ngay:     systemctl start tapchi-backup.service"
echo "   Xem timer tiếp theo:  systemctl list-timers tapchi-*"
echo "   Gỡ cài đặt:           systemctl disable --now tapchi-backup.timer tapchi-health.timer"
echo ""
echo " ⚠ Nhớ kiểm tra và sửa: $ENV_DIR/backup.env"
echo "══════════════════════════════════════════════════════"
