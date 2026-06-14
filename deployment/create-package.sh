#!/bin/bash

###########################################
# SCRIPT TẠO GÓI CÀI ĐẶT
###########################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================"
echo "TẠO GÓI CÀI ĐẶT"
echo "========================================"
echo -e "${NC}"

# Get project root
PROJECT_ROOT=$(dirname $(dirname $(readlink -f $0)))
echo -e "${YELLOW}Thư mục gốc: $PROJECT_ROOT${NC}"

# Create package name
DATE=$(date +%Y%m%d)
PACKAGE_NAME="tapchi-hcqs-v2.0-${DATE}"
PACKAGE_DIR="/tmp/${PACKAGE_NAME}"
PACKAGE_FILE="${PACKAGE_NAME}.tar.gz"

echo -e "${YELLOW}Tên gói: $PACKAGE_NAME${NC}"

# Clean old package
if [ -d "$PACKAGE_DIR" ]; then
    rm -rf "$PACKAGE_DIR"
fi

# Create package directory
mkdir -p "$PACKAGE_DIR"

echo -e "${YELLOW}Sao chép files...${NC}"

# Copy deployment scripts
cp -r "$PROJECT_ROOT/deployment" "$PACKAGE_DIR/"

# Copy nextjs_space (exclude node_modules, .next, etc.)
echo -e "${YELLOW}Sao chép ứng dụng...${NC}"
rsync -a --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.build' \
    --exclude='*.log' \
    --exclude='.env*' \
    --exclude='.git' \
    --exclude='.gitignore' \
    --exclude='*.pdf' \
    "$PROJECT_ROOT/nextjs_space/" "$PACKAGE_DIR/nextjs_space/"

# Copy documentation
echo -e "${YELLOW}Sao chép tài liệu...${NC}"
mkdir -p "$PACKAGE_DIR/docs"
cp "$PROJECT_ROOT/SYSTEM_REPORT.md" "$PACKAGE_DIR/docs/" 2>/dev/null || true
cp "$PROJECT_ROOT/USER_GUIDE_SYSADMIN.md" "$PACKAGE_DIR/docs/" 2>/dev/null || true

# Create README for package
cat > "$PACKAGE_DIR/README.txt" <<'EOF'
========================================
TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ
PHIÊN BẢN 2.0
========================================

CÀI ĐẶT NHANH:

1. Upload gói này lên server Ubuntu
2. Giải nén: tar -xzf tapchi-hcqs-v2.0-*.tar.gz
3. Vào thư mục: cd tapchi-hcqs-v2.0-*/deployment
4. Chạy: sudo ./setup.sh

HƯỚNG DẪN ĐẦY ĐỦ:
- Đọc file: deployment/QUICK_START.md
- Hoặc: deployment/README.md

TÀI LIỆU:
- docs/SYSTEM_REPORT.md
- docs/USER_GUIDE_SYSADMIN.md

HỖ TRỢ:
- Email: support@tapchi-hcqs.vn
- Hotline: 024.xxxx.xxxx

========================================
EOF

# Create installation script
cat > "$PACKAGE_DIR/install.sh" <<'EOF'
#!/bin/bash
cd deployment
chmod +x *.sh
sudo ./setup.sh
EOF
chmod +x "$PACKAGE_DIR/install.sh"

# Create archive
echo -e "${YELLOW}Tạo file nén...${NC}"
cd /tmp
tar -czf "$PACKAGE_FILE" "$PACKAGE_NAME" --exclude='.DS_Store'

# Calculate size
SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)

echo -e "${GREEN}"
echo "========================================"
echo "HOÀN TẤT"
echo "========================================"
echo -e "${NC}"
echo -e "${GREEN}Gói cài đặt: /tmp/$PACKAGE_FILE${NC}"
echo -e "${GREEN}Kích thước: $SIZE${NC}"
echo ""
echo -e "${BLUE}Cách triển khai:${NC}"
echo "1. Download gói về máy local:"
echo "   scp user@server:/tmp/$PACKAGE_FILE ."
echo ""
echo "2. Upload lên server mới:"
echo "   scp $PACKAGE_FILE user@new-server:/home/user/"
echo ""
echo "3. Trên server mới:"
echo "   tar -xzf $PACKAGE_FILE"
echo "   cd ${PACKAGE_NAME}/"
echo "   sudo ./install.sh"
echo ""

# Cleanup
rm -rf "$PACKAGE_DIR"

echo -e "${GREEN}Done! 🎉${NC}"
