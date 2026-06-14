#!/bin/bash

###########################################
# SCRIPT GỠ CÀI ĐẶT TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ
###########################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_NAME="tapchi-hcqs"
APP_USER="tapchi"
APP_DIR="/opt/${APP_NAME}"

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Script này phải chạy với quyền root (sudo)${NC}"
   exit 1
fi

echo -e "${RED}"
echo "========================================"
echo "CẢNH BÁO: GỠ CÀI ĐẶT ỨNG DỤNG"
echo "========================================"
echo -e "${NC}"
echo "Hành động này sẽ:"
echo "  - Dừng và xóa service"
echo "  - Xóa tất cả file ứng dụng"
echo "  - Xóa database và người dùng PostgreSQL"
echo "  - Xóa người dùng hệ thống"
echo ""
read -p "Bạn có chắc chắn muốn tiếp tục? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Hủy bỏ.${NC}"
    exit 0
fi

read -p "Tạo backup trước khi gỡ? (y/n): " BACKUP
if [[ "$BACKUP" == "y" ]]; then
    echo -e "${YELLOW}Tạo backup...${NC}"
    DATE=$(date +%Y%m%d_%H%M%S)
    mkdir -p /tmp/tapchi-backup-$DATE
    
    if [ -d "$APP_DIR" ]; then
        cp -r $APP_DIR/uploads /tmp/tapchi-backup-$DATE/ 2>/dev/null || true
        cp $APP_DIR/.env /tmp/tapchi-backup-$DATE/ 2>/dev/null || true
        cp $APP_DIR/CREDENTIALS.txt /tmp/tapchi-backup-$DATE/ 2>/dev/null || true
    fi
    
    pg_dump -U tapchi_user tapchi_hcqs > /tmp/tapchi-backup-$DATE/database.sql 2>/dev/null || true
    
    tar -czf /tmp/tapchi-backup-final-$DATE.tar.gz -C /tmp tapchi-backup-$DATE
    rm -rf /tmp/tapchi-backup-$DATE
    
    echo -e "${GREEN}Backup đã được lưu tại: /tmp/tapchi-backup-final-$DATE.tar.gz${NC}"
fi

echo -e "${YELLOW}Dừng service...${NC}"
systemctl stop $APP_NAME 2>/dev/null || true
systemctl disable $APP_NAME 2>/dev/null || true

echo -e "${YELLOW}Xóa service file...${NC}"
rm -f /etc/systemd/system/$APP_NAME.service
systemctl daemon-reload

echo -e "${YELLOW}Xóa Nginx config...${NC}"
rm -f /etc/nginx/sites-enabled/$APP_NAME
rm -f /etc/nginx/sites-available/$APP_NAME
nginx -t > /dev/null 2>&1 && systemctl reload nginx || true

echo -e "${YELLOW}Xóa database...${NC}"
sudo -u postgres psql <<EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS tapchi_hcqs;
DROP USER IF EXISTS tapchi_user;
EOF

echo -e "${YELLOW}Xóa crontab...${NC}"
crontab -u $APP_USER -r 2>/dev/null || true

echo -e "${YELLOW}Xóa thư mục ứng dụng...${NC}"
rm -rf $APP_DIR

echo -e "${YELLOW}Xóa người dùng hệ thống...${NC}"
userdel -r $APP_USER 2>/dev/null || true

echo -e "${GREEN}"
echo "========================================"
echo "GỠ CÀI ĐẶT HOÀN TẤT"
echo "========================================"
echo -e "${NC}"
echo "Tất cả thành phần đã được gỡ bỏ."
if [[ "$BACKUP" == "y" ]]; then
    echo "Backup: /tmp/tapchi-backup-final-$DATE.tar.gz"
fi
echo ""
