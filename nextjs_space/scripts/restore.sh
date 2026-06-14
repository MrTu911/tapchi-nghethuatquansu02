#!/bin/bash
# ============================================================
# restore.sh — Restore backup cho Tạp chí NCKH Hậu cần Quân sự
# Cách dùng:
#   ./scripts/restore.sh /var/backups/tapchi/db/tapchi_db_20260414_020000.sql.gz
#
# LƯU Ý: Script này sẽ XÓA dữ liệu hiện tại trong database!
#         Chỉ chạy khi thật sự cần khôi phục.
# ============================================================

set -euo pipefail

DB_NAME="${POSTGRES_DB:-tapchi_prod}"
DB_USER="${POSTGRES_USER:-tapchi}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
LOG_PREFIX="[RESTORE $(date '+%Y-%m-%d %H:%M:%S')]"

# ── Kiểm tra tham số đầu vào ─────────────────────────────────
if [ $# -eq 0 ]; then
  echo "Cách dùng: $0 <đường_dẫn_file_backup.sql.gz>"
  echo ""
  echo "Ví dụ:"
  echo "  $0 /var/backups/tapchi/db/tapchi_db_20260414_020000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "$LOG_PREFIX ✗ Không tìm thấy file backup: $BACKUP_FILE"
  exit 1
fi

# ── Xác nhận từ người dùng ───────────────────────────────────
echo "$LOG_PREFIX ════════════════════════════════════════════════"
echo "$LOG_PREFIX ⚠  CẢNH BÁO: Sắp restore database!"
echo "$LOG_PREFIX    Database: $DB_NAME trên $DB_HOST:$DB_PORT"
echo "$LOG_PREFIX    File backup: $BACKUP_FILE"
echo "$LOG_PREFIX    Dữ liệu hiện tại sẽ bị XÓA HOÀN TOÀN!"
echo "$LOG_PREFIX ════════════════════════════════════════════════"
read -rp "Nhập 'XAC_NHAN_RESTORE' để tiếp tục: " CONFIRM

if [ "$CONFIRM" != "XAC_NHAN_RESTORE" ]; then
  echo "$LOG_PREFIX Đã hủy restore."
  exit 0
fi

# ── Dừng app trước khi restore (tránh conflict) ──────────────
echo "$LOG_PREFIX [1/4] Kiểm tra kết nối database..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 \
  && echo "$LOG_PREFIX ✓ Kết nối database OK" \
  || { echo "$LOG_PREFIX ✗ Không thể kết nối database"; exit 1; }

# ── Drop và tạo lại database ─────────────────────────────────
echo "$LOG_PREFIX [2/4] Xóa dữ liệu cũ..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS ${DB_NAME}_restore_backup;" > /dev/null 2>&1 || true

# Đổi tên DB hiện tại thành backup tạm (safety net)
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_restore_backup;" > /dev/null 2>&1 \
  && echo "$LOG_PREFIX ✓ Đổi tên DB cũ thành ${DB_NAME}_restore_backup" \
  || echo "$LOG_PREFIX ⚠ Không đổi được tên DB cũ (có thể đã tồn tại)"

# Tạo DB mới
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null 2>&1
echo "$LOG_PREFIX ✓ Tạo database mới: $DB_NAME"

# ── Restore từ file backup ────────────────────────────────────
echo "$LOG_PREFIX [3/4] Restore từ $BACKUP_FILE..."
PGPASSWORD="$POSTGRES_PASSWORD" gunzip -c "$BACKUP_FILE" | psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --quiet

echo "$LOG_PREFIX ✓ Restore hoàn thành"

# ── Chạy migrations để đảm bảo schema cập nhật ───────────────
echo "$LOG_PREFIX [4/4] Chạy Prisma migrations..."
npx prisma migrate deploy 2>&1 | tail -5
echo "$LOG_PREFIX ✓ Migrations hoàn thành"

# ── Kết quả ──────────────────────────────────────────────────
echo ""
echo "$LOG_PREFIX ════════════════════════════════════════════════"
echo "$LOG_PREFIX ✓ RESTORE THÀNH CÔNG!"
echo "$LOG_PREFIX   Database backup cũ: ${DB_NAME}_restore_backup"
echo "$LOG_PREFIX   Hãy xóa thủ công nếu mọi thứ hoạt động bình thường:"
echo "$LOG_PREFIX   psql -c 'DROP DATABASE ${DB_NAME}_restore_backup;'"
echo "$LOG_PREFIX ════════════════════════════════════════════════"
