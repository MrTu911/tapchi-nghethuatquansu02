#!/bin/bash
# ============================================================
# backup.sh — Backup tự động cho Tạp chí NCKH Hậu cần Quân sự
# Hỗ trợ: Docker Compose (auto-detect) và native PostgreSQL
#
# Cách dùng:
#   ./scripts/backup.sh
#
# Systemd timer (khuyến nghị):
#   sudo ./scripts/install-backup-service.sh
#
# Cron thủ công (dự phòng):
#   0 2 * * * /opt/tapchi/scripts/backup.sh >> /var/log/tapchi-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── Cấu hình (overrideable qua env) ──────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tapchi}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_NAME="${POSTGRES_DB:-tapchi_prod}"
DB_USER="${POSTGRES_USER:-tapchi}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
# Docker: container name của postgres service trong docker-compose.yml
DOCKER_PG_CONTAINER="${DOCKER_PG_CONTAINER:-tapchi_postgres}"
# Docker: volume name của uploads
DOCKER_UPLOAD_VOLUME="${DOCKER_UPLOAD_VOLUME:-tapchi_uploads_data}"
UPLOAD_DIR="${UPLOAD_DIR:-$(dirname "$0")/../public/uploads}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_PREFIX="[BACKUP $(date '+%Y-%m-%d %H:%M:%S')]"

# ── Phát hiện môi trường Docker ──────────────────────────────
USE_DOCKER=false
if docker ps --filter "name=${DOCKER_PG_CONTAINER}" --format '{{.Names}}' 2>/dev/null | grep -q "${DOCKER_PG_CONTAINER}"; then
  USE_DOCKER=true
fi

# ── Kiểm tra thư mục backup ───────────────────────────────────
mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"

echo "$LOG_PREFIX ═══════════════════════════════════════"
echo "$LOG_PREFIX Bắt đầu backup..."
echo "$LOG_PREFIX Môi trường: $([ "$USE_DOCKER" = true ] && echo 'Docker Compose' || echo 'Native')"

# ── 1. Backup PostgreSQL ──────────────────────────────────────
echo "$LOG_PREFIX [1/3] Backup database $DB_NAME..."

DB_BACKUP_FILE="$BACKUP_DIR/db/tapchi_db_${TIMESTAMP}.sql.gz"

if [ "$USE_DOCKER" = true ]; then
  # Chạy pg_dump bên trong container — không cần pg_dump trên host
  docker exec "$DOCKER_PG_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --format=plain --no-owner --no-acl \
    | gzip -9 > "$DB_BACKUP_FILE"
else
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --format=plain \
    --no-owner \
    --no-acl \
    | gzip -9 > "$DB_BACKUP_FILE"
fi

DB_SIZE=$(du -sh "$DB_BACKUP_FILE" | cut -f1)
echo "$LOG_PREFIX ✓ Database backup: $DB_BACKUP_FILE ($DB_SIZE)"

# ── 2. Backup uploaded files ──────────────────────────────────
echo "$LOG_PREFIX [2/3] Backup uploads..."

UPLOAD_BACKUP_FILE="$BACKUP_DIR/uploads/tapchi_uploads_${TIMESTAMP}.tar.gz"

if [ "$USE_DOCKER" = true ]; then
  # Backup Docker volume bằng container tạm thời
  if docker volume inspect "$DOCKER_UPLOAD_VOLUME" > /dev/null 2>&1; then
    docker run --rm \
      -v "${DOCKER_UPLOAD_VOLUME}:/uploads:ro" \
      -v "$BACKUP_DIR/uploads:/backup" \
      alpine tar -czf "/backup/tapchi_uploads_${TIMESTAMP}.tar.gz" -C / uploads
    UPLOAD_SIZE=$(du -sh "$UPLOAD_BACKUP_FILE" | cut -f1)
    echo "$LOG_PREFIX ✓ Uploads backup (Docker volume): $UPLOAD_BACKUP_FILE ($UPLOAD_SIZE)"
  else
    echo "$LOG_PREFIX ⚠ Docker volume không tồn tại: $DOCKER_UPLOAD_VOLUME"
  fi
elif [ -d "$UPLOAD_DIR" ]; then
  tar -czf "$UPLOAD_BACKUP_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
  UPLOAD_SIZE=$(du -sh "$UPLOAD_BACKUP_FILE" | cut -f1)
  echo "$LOG_PREFIX ✓ Uploads backup: $UPLOAD_BACKUP_FILE ($UPLOAD_SIZE)"
else
  echo "$LOG_PREFIX ⚠ Thư mục uploads không tồn tại: $UPLOAD_DIR"
fi

# ── 3. Xóa backup cũ hơn RETENTION_DAYS ngày ──────────────────
echo "$LOG_PREFIX [3/3] Xóa backup cũ hơn $RETENTION_DAYS ngày..."

DELETED_COUNT=0
while IFS= read -r old_file; do
  rm -f "$old_file"
  DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" \) -mtime "+$RETENTION_DAYS")

echo "$LOG_PREFIX ✓ Đã xóa $DELETED_COUNT file backup cũ"

# ── Tổng kết ─────────────────────────────────────────────────
echo "$LOG_PREFIX Backup hoàn thành."
echo "$LOG_PREFIX ═══════════════════════════════════════"
echo ""
