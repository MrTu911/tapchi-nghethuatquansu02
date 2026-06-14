#!/bin/bash
# ============================================================
# DEMO STOP SCRIPT — Tắt hệ thống sau demo
#
# Cách dùng:
#   bash STOP.sh
#
# Lưu ý: Dữ liệu demo sẽ được giữ lại trong Docker volumes.
#        Để xóa hoàn toàn (reset sạch), thêm tham số --clean:
#   bash STOP.sh --clean
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CLEAN_MODE=false
if [ "$1" = "--clean" ]; then
  CLEAN_MODE=true
fi

echo "=============================================="
echo "  TAPCHI — TẮT HỆ THỐNG DEMO"
echo "=============================================="
echo ""

if ! docker info &>/dev/null; then
  echo "Docker không chạy — không cần tắt."
  exit 0
fi

if [ "$CLEAN_MODE" = true ]; then
  echo "Chế độ CLEAN: Tắt và xóa toàn bộ dữ liệu demo..."
  docker compose down -v --remove-orphans 2>/dev/null || true
  echo "Đã xóa toàn bộ containers và volumes."
else
  echo "Tắt containers (giữ lại dữ liệu)..."
  docker compose down --remove-orphans 2>/dev/null || true
  echo "Đã tắt. Dữ liệu vẫn được lưu trong Docker volumes."
  echo "Lần sau chạy START.sh sẽ tiếp tục từ dữ liệu cũ."
fi

echo ""
echo "=============================================="
echo "  Hệ thống đã tắt."
if [ "$CLEAN_MODE" = true ]; then
  echo "  Lần chạy tiếp theo sẽ tạo lại dữ liệu mới."
fi
echo "=============================================="
