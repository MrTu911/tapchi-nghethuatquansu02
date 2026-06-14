#!/bin/bash
# ============================================================
# DEMO START SCRIPT — Chạy trên MÁY DEMO (từ USB)
# Mục đích: Load images, khởi động hệ thống, seed data
#
# Cách dùng:
#   bash START.sh
#
# Yêu cầu: Docker Desktop đã cài và đang chạy
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo "  TAPCHI — KHỞI ĐỘNG HỆ THỐNG DEMO"
echo "=============================================="
echo ""

# Kiểm tra Docker
if ! docker info &>/dev/null; then
  echo "[LỖI] Docker chưa chạy!"
  echo "      Hãy mở Docker Desktop và đợi nó khởi động xong rồi chạy lại."
  exit 1
fi
echo "[OK] Docker đang chạy."
echo ""

# ── Bước 1: Load Docker images ─────────────────────────────
echo "[1/4] Nạp Docker images từ USB..."
echo "      (Quá trình này mất 1-3 phút, vui lòng đợi...)"

for f in images/*.tar.gz; do
  if [ -f "$f" ]; then
    echo "      Đang nạp: $f"
    docker load < "$f"
  fi
done
echo "      OK"
echo ""

# ── Bước 2: Dừng containers cũ nếu có ─────────────────────
echo "[2/4] Dọn dẹp containers cũ (nếu có)..."
docker compose down --remove-orphans 2>/dev/null || true
echo "      OK"
echo ""

# ── Bước 3: Khởi động services ────────────────────────────
echo "[3/4] Khởi động database và ứng dụng..."
echo "      Khởi động PostgreSQL và Redis..."
docker compose up -d postgres redis

echo "      Đợi database sẵn sàng..."
WAIT=0
until docker compose exec -T postgres pg_isready -U tapchi -d tapchi_demo &>/dev/null; do
  WAIT=$((WAIT+2))
  if [ $WAIT -gt 60 ]; then
    echo "      [LỖI] Database không phản hồi sau 60 giây!"
    exit 1
  fi
  sleep 2
done
echo "      Database sẵn sàng."

echo "      Chạy database migration..."
docker compose run --rm migrate

echo "      Khởi động ứng dụng..."
docker compose up -d app
echo "      OK"
echo ""

# ── Bước 4: Seed dữ liệu mẫu ──────────────────────────────
echo "[4/4] Tạo dữ liệu demo..."
# Thử seed-sample-data trước, nếu lỗi thử seed-production, bỏ qua nếu data đã có
docker compose exec -T app npx tsx scripts/seed-sample-data.ts 2>/dev/null && \
  echo "      Đã tạo dữ liệu mẫu." || \
  (docker compose exec -T app npm run seed:production 2>/dev/null && \
    echo "      Đã seed production data." || \
    echo "      Bỏ qua seed (dữ liệu đã tồn tại hoặc không cần thiết).")
echo ""

# ── Đợi app healthy ────────────────────────────────────────
echo "Đợi ứng dụng khởi động hoàn toàn..."
WAIT=0
until curl -sf http://localhost:3000/api/health &>/dev/null; do
  WAIT=$((WAIT+3))
  if [ $WAIT -gt 120 ]; then
    echo "[CẢNH BÁO] App chưa healthy sau 2 phút — thử mở trình duyệt vẫn có thể hoạt động."
    break
  fi
  printf "."
  sleep 3
done
echo ""
echo ""

echo "=============================================="
echo "  HỆ THỐNG ĐÃ SẴN SÀNG!"
echo ""
echo "  Truy cập: http://localhost:3000"
echo ""
echo "  Để tắt hệ thống sau demo: bash STOP.sh"
echo "=============================================="
