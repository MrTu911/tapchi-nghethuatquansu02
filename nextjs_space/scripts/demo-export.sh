#!/bin/bash
# ============================================================
# DEMO EXPORT SCRIPT — Chạy trên MÁY DEV
# Mục đích: Đóng gói toàn bộ hệ thống vào thư mục usb-bundle/
#           sẵn sàng copy vào USB để demo offline
#
# Cách dùng:
#   cd /path/to/tapchi-hcqs/nextjs_space
#   bash scripts/demo-export.sh
#
# Kết quả: thư mục ../usb-bundle/ chứa mọi thứ cần thiết
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_DIR="$(dirname "$PROJECT_DIR")/usb-bundle"
IMAGE_NAME="tapchi-app"
IMAGE_TAG="latest"

echo "=============================================="
echo "  TAPCHI DEMO — ĐÓNG GÓI USB OFFLINE"
echo "=============================================="
echo ""
echo "Project: $PROJECT_DIR"
echo "Output:  $BUNDLE_DIR"
echo ""

# Kiểm tra Docker đang chạy
if ! docker info &>/dev/null; then
  echo "[LỖI] Docker chưa chạy. Hãy khởi động Docker Desktop trước."
  exit 1
fi

# ── Bước 1: Kiểm tra / Build app image ────────────────────
echo "[1/5] Kiểm tra Docker image ứng dụng..."
cd "$PROJECT_DIR"

# Nếu image tapchi-app:latest chưa có, thử tag từ nextjs_space-app hoặc build mới
if ! docker image inspect "$IMAGE_NAME:$IMAGE_TAG" &>/dev/null; then
  # Docker Compose thường đặt tên image theo thư mục: <folder>-app
  FOLDER_IMAGE="$(basename "$PROJECT_DIR")-app:latest"
  if docker image inspect "$FOLDER_IMAGE" &>/dev/null; then
    echo "      Tìm thấy image $FOLDER_IMAGE — gắn tag $IMAGE_NAME:$IMAGE_TAG"
    docker tag "$FOLDER_IMAGE" "$IMAGE_NAME:$IMAGE_TAG"
  else
    echo "      Image chưa có — tiến hành build (mất 5-15 phút)..."
    docker compose build app
    docker tag "$(docker compose images -q app 2>/dev/null | head -1)" "$IMAGE_NAME:$IMAGE_TAG"
  fi
fi
echo "      OK — Image: $IMAGE_NAME:$IMAGE_TAG ($(docker image inspect $IMAGE_NAME:$IMAGE_TAG --format '{{.Size}}' | awk '{printf "%.0f MB", $1/1024/1024}'))"

# ── Bước 2: Đảm bảo images postgres và redis có sẵn ───────
echo "[2/5] Kiểm tra images postgres và redis..."
if ! docker image inspect postgres:16-alpine &>/dev/null; then
  echo "      Kéo postgres:16-alpine từ internet..."
  docker pull postgres:16-alpine
fi
if ! docker image inspect redis:7-alpine &>/dev/null; then
  echo "      Kéo redis:7-alpine từ internet..."
  docker pull redis:7-alpine
fi
echo "      OK"

# ── Bước 3: Export images ra file ─────────────────────────
echo "[3/5] Xuất images ra file nén..."
mkdir -p "$BUNDLE_DIR/images"

echo "      Xuất $IMAGE_NAME:$IMAGE_TAG ..."
docker save "$IMAGE_NAME:$IMAGE_TAG" | gzip > "$BUNDLE_DIR/images/tapchi-app.tar.gz"

echo "      Xuất postgres:16-alpine ..."
docker save postgres:16-alpine | gzip > "$BUNDLE_DIR/images/postgres.tar.gz"

echo "      Xuất redis:7-alpine ..."
docker save redis:7-alpine | gzip > "$BUNDLE_DIR/images/redis.tar.gz"

echo "      OK"

# ── Bước 4: Copy files cần thiết ──────────────────────────
echo "[4/5] Copy files cấu hình và scripts..."

cp "$PROJECT_DIR/docker-compose.demo.yml" "$BUNDLE_DIR/docker-compose.yml"
cp "$PROJECT_DIR/.env.demo"               "$BUNDLE_DIR/.env"
cp "$PROJECT_DIR/scripts/demo-start.sh"   "$BUNDLE_DIR/START.sh"
cp "$PROJECT_DIR/scripts/demo-stop.sh"    "$BUNDLE_DIR/STOP.sh"

# Copy scripts cần thiết để seed data
mkdir -p "$BUNDLE_DIR/scripts"
cp "$PROJECT_DIR/scripts/init-db.sql"          "$BUNDLE_DIR/scripts/" 2>/dev/null || true
cp "$PROJECT_DIR/scripts/seed-sample-data.ts"  "$BUNDLE_DIR/scripts/" 2>/dev/null || true
cp "$PROJECT_DIR/scripts/seed-production.ts"   "$BUNDLE_DIR/scripts/" 2>/dev/null || true
cp "$PROJECT_DIR/scripts/seed.ts"              "$BUNDLE_DIR/scripts/" 2>/dev/null || true

# Copy uploads nếu có
if [ -d "$PROJECT_DIR/public/uploads" ] && [ "$(ls -A "$PROJECT_DIR/public/uploads" 2>/dev/null)" ]; then
  echo "      Copy thư mục uploads..."
  mkdir -p "$BUNDLE_DIR/uploads"
  cp -r "$PROJECT_DIR/public/uploads/." "$BUNDLE_DIR/uploads/"
else
  mkdir -p "$BUNDLE_DIR/uploads"
fi

chmod +x "$BUNDLE_DIR/START.sh" "$BUNDLE_DIR/STOP.sh"
echo "      OK"

# ── Bước 5: Tóm tắt ───────────────────────────────────────
echo "[5/5] Hoàn thành!"
echo ""
echo "=============================================="
BUNDLE_SIZE=$(du -sh "$BUNDLE_DIR" 2>/dev/null | cut -f1)
echo "  Thư mục bundle: $BUNDLE_DIR"
echo "  Tổng dung lượng: $BUNDLE_SIZE"
echo ""
echo "  Nội dung USB:"
ls -lh "$BUNDLE_DIR/"
echo ""
echo "  BƯỚC TIẾP THEO:"
echo "  1. Copy thư mục usb-bundle/ vào USB"
echo "  2. Trên máy demo: cài Docker Desktop"
echo "  3. Cắm USB, chạy START.sh (Linux/Mac)"
echo "     hoặc click chuột phải → Git Bash → bash START.sh (Windows)"
echo "  4. Mở trình duyệt: http://localhost:3000"
echo "=============================================="
