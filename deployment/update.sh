#!/bin/bash

###########################################
# SCRIPT CẬP NHẬT ỨNG DỤNG
###########################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="tapchi-hcqs"
APP_DIR="/opt/${APP_NAME}"
APP_USER="tapchi"

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Script này phải chạy với quyền root (sudo)${NC}"
   exit 1
fi

echo -e "${BLUE}"
echo "========================================"
echo "CẬP NHẬT ỨNG DỤNG"
echo "========================================"
echo -e "${NC}"

read -p "Nhập đường dẫn đến source code mới: " SOURCE_DIR

if [ ! -d "$SOURCE_DIR/nextjs_space" ]; then
    echo -e "${RED}Không tìm thấy thư mục nextjs_space trong $SOURCE_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Tạo backup trước khi cập nhật...${NC}"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $APP_DIR/backups
cp $APP_DIR/.env $APP_DIR/backups/.env.$DATE
tar -czf $APP_DIR/backups/app_$DATE.tar.gz -C $APP_DIR --exclude='node_modules' --exclude='.next' --exclude='.build' --exclude='backups' --exclude='uploads' .
echo -e "${GREEN}Backup tại: $APP_DIR/backups/app_$DATE.tar.gz${NC}"

echo -e "${YELLOW}Dừng ứng dụng...${NC}"
systemctl stop $APP_NAME

echo -e "${YELLOW}Sao chép file mới...${NC}"
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.build' \
      --exclude='*.log' --exclude='.env*' --exclude='uploads' --exclude='backups' \
      $SOURCE_DIR/nextjs_space/ $APP_DIR/

chown -R $APP_USER:$APP_USER $APP_DIR

echo -e "${YELLOW}Cài đặt dependencies...${NC}"
cd $APP_DIR
sudo -u $APP_USER yarn install --production=false

echo -e "${YELLOW}Chạy migrations...${NC}"
sudo -u $APP_USER yarn prisma migrate deploy

echo -e "${YELLOW}Build ứng dụng...${NC}"
sudo -u $APP_USER NODE_OPTIONS="--max-old-space-size=4096" yarn build

echo -e "${YELLOW}Khởi động lại ứng dụng...${NC}"
systemctl start $APP_NAME
sleep 3

if systemctl is-active --quiet $APP_NAME; then
    echo -e "${GREEN}"
    echo "========================================"
    echo "CẬP NHẬT THÀNH CÔNG"
    echo "========================================"
    echo -e "${NC}"
    echo "Ứng dụng đã được cập nhật và khởi động lại."
    echo "Backup: $APP_DIR/backups/app_$DATE.tar.gz"
else
    echo -e "${RED}"
    echo "========================================"
    echo "LỖI: Ứng dụng không khởi động"
    echo "========================================"
    echo -e "${NC}"
    echo "Rollback backup với lệnh:"
    echo "  cd $APP_DIR"
    echo "  tar -xzf backups/app_$DATE.tar.gz"
    echo "  systemctl start $APP_NAME"
    echo ""
    echo "Kiểm tra logs: journalctl -u $APP_NAME -f"
    exit 1
fi
