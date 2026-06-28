#!/usr/bin/env bash
# Sinh lại toàn bộ bộ hồ sơ nghiệm thu (.docx) từ các script trong thư mục này.
# Yêu cầu: Node.js + gói "docx" (đã có trong nextjs_space/node_modules).
# Cách dùng: từ thư mục nextjs_space chạy  bash docs/nghiem-thu/_generator/build.sh
set -euo pipefail

# Xác định gốc nextjs_space (3 cấp trên thư mục _generator)
GEN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$GEN_DIR/../../.." && pwd)"

cd "$APP_DIR"
export NODE_PATH="$APP_DIR/node_modules"

for n in 00 01 02 03 04 05 06 07 08 09; do
  node "$GEN_DIR/doc$n.js"
done

echo "Hoàn tất. Tệp .docx nằm tại: $APP_DIR/docs/nghiem-thu/"
