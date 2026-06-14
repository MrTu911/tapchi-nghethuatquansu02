#!/bin/bash

###########################################
# SCRIPT KIỂM TRA YÊU CẦU HỆ THỐNG
###########################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================"
echo "KIỂM TRA YÊU CẦU HỆ THỐNG"
echo "========================================"
echo -e "${NC}"

PASSED=0
FAILED=0
WARNING=0

# Check OS
echo -n "Kiểm tra hệ điều hành... "
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        VERSION_NUM=$(echo $VERSION_ID | cut -d. -f1)
        if [[ "$VERSION_NUM" -ge 20 ]]; then
            echo -e "${GREEN}✅ Ubuntu $VERSION_ID${NC}"
            ((PASSED++))
        else
            echo -e "${RED}❌ Ubuntu $VERSION_ID (yêu cầu >= 20.04)${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}❌ $ID (khuyến nghị Ubuntu)${NC}"
        ((WARNING++))
    fi
else
    echo -e "${RED}❌ Không xác định được OS${NC}"
    ((FAILED++))
fi

# Check CPU cores
echo -n "Kiểm tra CPU cores... "
CPU_CORES=$(nproc)
if [[ "$CPU_CORES" -ge 2 ]]; then
    echo -e "${GREEN}✅ $CPU_CORES cores${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  $CPU_CORES core (khuyến nghị >= 2)${NC}"
    ((WARNING++))
fi

# Check RAM
echo -n "Kiểm tra RAM... "
RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
if [[ "$RAM_GB" -ge 4 ]]; then
    echo -e "${GREEN}✅ ${RAM_GB}GB${NC}"
    ((PASSED++))
elif [[ "$RAM_GB" -ge 2 ]]; then
    echo -e "${YELLOW}⚠️  ${RAM_GB}GB (khuyến nghị >= 4GB)${NC}"
    ((WARNING++))
else
    echo -e "${RED}❌ ${RAM_GB}GB (yêu cầu tối thiểu 2GB)${NC}"
    ((FAILED++))
fi

# Check disk space
echo -n "Kiểm tra dung lượng ổ cứng... "
DISK_GB=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [[ "$DISK_GB" -ge 50 ]]; then
    echo -e "${GREEN}✅ ${DISK_GB}GB available${NC}"
    ((PASSED++))
elif [[ "$DISK_GB" -ge 30 ]]; then
    echo -e "${YELLOW}⚠️  ${DISK_GB}GB available (khuyến nghị >= 50GB)${NC}"
    ((WARNING++))
else
    echo -e "${RED}❌ ${DISK_GB}GB available (yêu cầu tối thiểu 30GB)${NC}"
    ((FAILED++))
fi

# Check root permission
echo -n "Kiểm tra quyền root... "
if [[ $EUID -eq 0 ]]; then
    echo -e "${GREEN}✅ Có quyền root${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Không có quyền root (cần sudo)${NC}"
    ((FAILED++))
fi

# Check internet connection
echo -n "Kiểm tra kết nối internet... "
if ping -c 1 8.8.8.8 &> /dev/null; then
    echo -e "${GREEN}✅ Kết nối OK${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Không có kết nối internet${NC}"
    ((FAILED++))
fi

# Check ports
echo -n "Kiểm tra port 3000... "
if ! lsof -i :3000 &> /dev/null; then
    echo -e "${GREEN}✅ Available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Port 3000 đang được sử dụng${NC}"
    ((WARNING++))
fi

echo -n "Kiểm tra port 80... "
if ! lsof -i :80 &> /dev/null; then
    echo -e "${GREEN}✅ Available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Port 80 đang được sử dụng${NC}"
    ((WARNING++))
fi

echo -n "Kiểm tra port 443... "
if ! lsof -i :443 &> /dev/null; then
    echo -e "${GREEN}✅ Available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Port 443 đang được sử dụng${NC}"
    ((WARNING++))
fi

# Check existing installations
echo -e "\n${BLUE}Kiểm tra phần mềm đã cài:${NC}"

echo -n "  Node.js... "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ $(node -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Chưa cài${NC}"
fi

echo -n "  Yarn... "
if command -v yarn &> /dev/null; then
    echo -e "${GREEN}✅ $(yarn -v)${NC}"
else
    echo -e "${YELLOW}⚠️  Chưa cài${NC}"
fi

echo -n "  PostgreSQL... "
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ $(psql --version | awk '{print $3}')${NC}"
else
    echo -e "${YELLOW}⚠️  Chưa cài${NC}"
fi

echo -n "  Nginx... "
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ $(nginx -v 2>&1 | awk -F/ '{print $2}')${NC}"
else
    echo -e "${YELLOW}⚠️  Chưa cài${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}KẾT QUẢ KIỂM TRA${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Đạt: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Cảnh báo: $WARNING${NC}"
echo -e "${RED}❌ Không đạt: $FAILED${NC}"
echo ""

if [[ "$FAILED" -gt 0 ]]; then
    echo -e "${RED}Hệ thống chưa đáp ứng yêu cầu tối thiểu!${NC}"
    echo -e "${YELLOW}Vui lòng khắc phục các vấn đề trên trước khi cài đặt.${NC}"
    exit 1
elif [[ "$WARNING" -gt 0 ]]; then
    echo -e "${YELLOW}Hệ thống có thể chạy nhưng không tối ưu.${NC}"
    echo -e "${YELLOW}Khuyến nghị nâng cấp phần cứng để hiệu suất tốt hơn.${NC}"
    read -p "Tiếp tục cài đặt? (y/n): " CONTINUE
    if [[ "$CONTINUE" != "y" ]]; then
        exit 0
    fi
else
    echo -e "${GREEN}Hệ thống đáp ứng đầy đủ yêu cầu! Có thể tiến hành cài đặt.${NC}"
    echo -e "${GREEN}Chạy: sudo ./setup.sh${NC}"
fi
