#!/usr/bin/env bash
# Xuất PDF cho 10 tài liệu + gộp thành 1 PDF tổng (bìa + mục lục có số trang).
# Yêu cầu: LibreOffice (soffice), Node.js + gói docx, python pypdf (pip install pypdf).
# Cách dùng: bash docs/nghiem-thu/_generator/build-pdf.sh
set -euo pipefail
GEN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Bảo đảm .docx mới nhất trước khi xuất PDF
bash "$GEN_DIR/build.sh"

python3 "$GEN_DIR/build_pdf.py"
echo "Xong. PDF từng tài liệu ở docs/nghiem-thu/pdf/ ; PDF tổng: docs/nghiem-thu/HO-SO-NGHIEM-THU-NTQS-Full.pdf"
