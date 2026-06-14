#!/bin/bash

###########################################
# SCRIPT CÀI ĐẶT TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ
# Phát triển bởi: DeepAgent - Abacus.AI
# Phiên bản: 2.0
###########################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="tapchi-hcqs"
APP_USER="tapchi"
APP_DIR="/opt/${APP_NAME}"
NODE_VERSION="18"
POSTGRES_VERSION="14"

# Function to print colored messages
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    echo ""
    print_message "$BLUE" "========================================"
    print_message "$BLUE" "$1"
    print_message "$BLUE" "========================================"
    echo ""
}

print_success() {
    print_message "$GREEN" "✅ $1"
}

print_error() {
    print_message "$RED" "❌ $1"
}

print_warning() {
    print_message "$YELLOW" "⚠️  $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "Script này phải chạy với quyền root (sudo)"
   exit 1
fi

print_header "BẮT ĐẦU CÀI ĐẶT TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ"

# Step 1: Update system
print_header "BƯỚC 1: CẬP NHẬT HỆ THỐNG"
print_message "$YELLOW" "Cập nhật danh sách package..."
apt-get update -qq
print_success "Hệ thống đã được cập nhật"

# Step 2: Install essential packages
print_header "BƯỚC 2: CÀI ĐẶT CÁC GÓI CƠ BẢN"
print_message "$YELLOW" "Cài đặt: curl, git, build-essential, nginx..."
apt-get install -y curl git build-essential nginx ufw fail2ban > /dev/null 2>&1
print_success "Các gói cơ bản đã được cài đặt"

# Step 3: Install Node.js
print_header "BƯỚC 3: CÀI ĐẶT NODE.JS ${NODE_VERSION}"
if command -v node &> /dev/null; then
    CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$CURRENT_NODE" -ge "$NODE_VERSION" ]]; then
        print_success "Node.js đã được cài đặt ($(node -v))"
    else
        print_warning "Nâng cấp Node.js lên phiên bản ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
        apt-get install -y nodejs > /dev/null 2>&1
        print_success "Node.js đã được nâng cấp ($(node -v))"
    fi
else
    print_message "$YELLOW" "Cài đặt Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    print_success "Node.js đã được cài đặt ($(node -v))"
fi

# Step 4: Install Yarn
print_header "BƯỚC 4: CÀI ĐẶT YARN"
if command -v yarn &> /dev/null; then
    print_success "Yarn đã được cài đặt ($(yarn -v))"
else
    print_message "$YELLOW" "Cài đặt Yarn..."
    npm install -g yarn > /dev/null 2>&1
    print_success "Yarn đã được cài đặt ($(yarn -v))"
fi

# Step 5: Install PostgreSQL
print_header "BƯỚC 5: CÀI ĐẶT POSTGRESQL ${POSTGRES_VERSION}"
if command -v psql &> /dev/null; then
    print_success "PostgreSQL đã được cài đặt"
else
    print_message "$YELLOW" "Cài đặt PostgreSQL ${POSTGRES_VERSION}..."
    apt-get install -y postgresql-${POSTGRES_VERSION} postgresql-contrib-${POSTGRES_VERSION} > /dev/null 2>&1
    systemctl enable postgresql > /dev/null 2>&1
    systemctl start postgresql > /dev/null 2>&1
    print_success "PostgreSQL đã được cài đặt"
fi

# Step 6: Create application user
print_header "BƯỚC 6: TẠO NGƯỜI DÙNG ỨNG DỤNG"
if id "$APP_USER" &>/dev/null; then
    print_success "Người dùng $APP_USER đã tồn tại"
else
    print_message "$YELLOW" "Tạo người dùng $APP_USER..."
    useradd -r -s /bin/bash -d $APP_DIR -m $APP_USER
    print_success "Người dùng $APP_USER đã được tạo"
fi

# Step 7: Create directories
print_header "BƯỚC 7: TẠO THƯ MỤC ỨNG DỤNG"
print_message "$YELLOW" "Tạo cấu trúc thư mục..."
mkdir -p $APP_DIR/{logs,backups,uploads}
mkdir -p $APP_DIR/uploads/{images,documents,videos,temp}
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR
print_success "Cấu trúc thư mục đã được tạo"

# Step 8: Configure database
print_header "BƯỚC 8: CẤU HÌNH DATABASE"
echo ""
print_message "$YELLOW" "Nhập thông tin database:"
read -p "Tên database [tapchi_hcqs]: " DB_NAME
DB_NAME=${DB_NAME:-tapchi_hcqs}

read -p "Tên người dùng database [tapchi_user]: " DB_USER
DB_USER=${DB_USER:-tapchi_user}

read -sp "Mật khẩu database: " DB_PASS
echo ""

if [ -z "$DB_PASS" ]; then
    # Generate random password
    DB_PASS=$(openssl rand -base64 32)
    print_warning "Sử dụng mật khẩu tự động: $DB_PASS"
fi

print_message "$YELLOW" "Tạo database và người dùng..."
sudo -u postgres psql <<EOF > /dev/null 2>&1
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

print_success "Database đã được tạo"

# Step 9: Copy application files
print_header "BƯỚC 9: SAO CHÉP FILE ỨNG DỤNG"
SOURCE_DIR=$(dirname $(dirname $(readlink -f $0)))
print_message "$YELLOW" "Sao chép từ: $SOURCE_DIR"
print_message "$YELLOW" "Đến: $APP_DIR"

# Copy only nextjs_space content
if [ -d "$SOURCE_DIR/nextjs_space" ]; then
    rsync -av --exclude='node_modules' --exclude='.next' --exclude='.build' \
          --exclude='*.log' --exclude='.env*' \
          $SOURCE_DIR/nextjs_space/ $APP_DIR/ > /dev/null 2>&1
    print_success "File ứng dụng đã được sao chép"
else
    print_error "Không tìm thấy thư mục nextjs_space"
    exit 1
fi

# Step 10: Create .env file
print_header "BƯỚC 10: TẠO FILE CẤU HÌNH (.env)"
read -p "Domain name hoặc IP [để trống nếu chạy local]: " DOMAIN
if [ -z "$DOMAIN" ]; then
    NEXTAUTH_URL="http://localhost:3000"
else
    read -p "Sử dụng HTTPS? (y/n) [y]: " USE_HTTPS
    USE_HTTPS=${USE_HTTPS:-y}
    if [[ "$USE_HTTPS" == "y" ]]; then
        NEXTAUTH_URL="https://$DOMAIN"
    else
        NEXTAUTH_URL="http://$DOMAIN"
    fi
fi

read -p "Port ứng dụng [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

# Generate NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)

print_message "$YELLOW" "Tạo file .env..."
cat > $APP_DIR/.env <<EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"

# NextAuth
NEXTAUTH_URL=$NEXTAUTH_URL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Application
NODE_ENV=production
PORT=$APP_PORT

# File Upload (Local Storage)
UPLOAD_DIR=/opt/tapchi-hcqs/uploads
MAX_FILE_SIZE=10485760

# Email (Optional - configure later)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# FROM_EMAIL=
# FROM_NAME=

# Security
BCRYPT_ROUNDS=10
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=30d
EOF

chown $APP_USER:$APP_USER $APP_DIR/.env
chmod 600 $APP_DIR/.env
print_success "File .env đã được tạo"

# Save credentials to a file
cat > $APP_DIR/CREDENTIALS.txt <<EOF
========================================
THÔNG TIN ĐĂNG NHẬP HỆ THỐNG
========================================

Database:
  - Tên: $DB_NAME
  - User: $DB_USER
  - Password: $DB_PASS
  
Application:
  - URL: $NEXTAUTH_URL
  - Port: $APP_PORT
  - NEXTAUTH_SECRET: $NEXTAUTH_SECRET

Tài khoản Admin mặc định:
  - Email: admin@tapchi-hcqs.vn
  - Password: Admin@123
  
LƯU Ý: Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

========================================
EOF
chown $APP_USER:$APP_USER $APP_DIR/CREDENTIALS.txt
chmod 600 $APP_DIR/CREDENTIALS.txt

# Step 11: Install dependencies
print_header "BƯỚC 11: CÀI ĐẶT DEPENDENCIES"
print_message "$YELLOW" "Cài đặt Node packages (có thể mất vài phút)..."
cd $APP_DIR
sudo -u $APP_USER yarn install --production=false > /dev/null 2>&1
print_success "Dependencies đã được cài đặt"

# Step 12: Setup database schema
print_header "BƯỚC 12: THIẾT LẬP DATABASE SCHEMA"
print_message "$YELLOW" "Chạy Prisma migrations..."
sudo -u $APP_USER yarn prisma migrate deploy
print_success "Database schema đã được thiết lập"

print_message "$YELLOW" "Chạy database seeding..."
sudo -u $APP_USER yarn prisma db seed 2>/dev/null || print_warning "Seeding bị lỗi (có thể bỏ qua)"
print_success "Database đã sẵn sàng"

# Step 13: Build application
print_header "BƯỚC 13: BUILD ỨNG DỤNG"
print_message "$YELLOW" "Build Next.js application (có thể mất vài phút)..."
sudo -u $APP_USER NODE_OPTIONS="--max-old-space-size=4096" yarn build
print_success "Ứng dụng đã được build"

# Step 14: Setup systemd service
print_header "BƯỚC 14: THIẾT LẬP SYSTEMD SERVICE"
print_message "$YELLOW" "Tạo service file..."
cat > /etc/systemd/system/$APP_NAME.service <<EOF
[Unit]
Description=Tạp chí Khoa học Hậu cần Quân sự
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PORT=$APP_PORT"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/app.log
StandardError=append:$APP_DIR/logs/error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR/uploads $APP_DIR/logs $APP_DIR/backups

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $APP_NAME > /dev/null 2>&1
print_success "Systemd service đã được thiết lập"

# Step 15: Setup Nginx
print_header "BƯỚC 15: THIẾT LẬP NGINX"
if [ ! -z "$DOMAIN" ]; then
    print_message "$YELLOW" "Tạo Nginx config cho $DOMAIN..."
    cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:$APP_PORT;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads {
        alias $APP_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t > /dev/null 2>&1
    systemctl reload nginx
    print_success "Nginx đã được cấu hình"
    
    if [[ "$USE_HTTPS" == "y" ]]; then
        print_message "$YELLOW" "\nCài đặt SSL với Certbot:"
        print_message "$YELLOW" "Chạy lệnh: sudo certbot --nginx -d $DOMAIN"
    fi
else
    print_warning "Bỏ qua cấu hình Nginx (không có domain)"
fi

# Step 16: Setup firewall
print_header "BƯỚC 16: THIẾT LẬP FIREWALL"
print_message "$YELLOW" "Cấu hình UFW..."
ufw --force enable > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
if [ -z "$DOMAIN" ]; then
    ufw allow $APP_PORT > /dev/null 2>&1
fi
print_success "Firewall đã được thiết lập"

# Step 17: Setup backup cron
print_header "BƯỚC 17: THIẾT LẬP SAO LƯU TỰ ĐỘNG"
print_message "$YELLOW" "Tạo backup script..."
cat > $APP_DIR/scripts/auto-backup.sh <<'EOFBACKUP'
#!/bin/bash
APP_DIR="/opt/tapchi-hcqs"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="tapchi_hcqs"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U tapchi_user $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: db_$DATE.sql.gz, uploads_$DATE.tar.gz"
EOFBACKUP

chmod +x $APP_DIR/scripts/auto-backup.sh
chown $APP_USER:$APP_USER $APP_DIR/scripts/auto-backup.sh

# Add to crontab
(crontab -u $APP_USER -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/auto-backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -u $APP_USER -
print_success "Backup tự động đã được thiết lập (2:00 AM hàng ngày)"

# Step 18: Start application
print_header "BƯỚC 18: KHỚI ĐỘNG ỨNG DỤNG"
print_message "$YELLOW" "Khởi động service..."
systemctl start $APP_NAME
sleep 3

if systemctl is-active --quiet $APP_NAME; then
    print_success "Ứng dụng đang chạy!"
else
    print_error "Ứng dụng không khởi động được!"
    print_message "$YELLOW" "Kiểm tra logs: journalctl -u $APP_NAME -f"
    exit 1
fi

# Final summary
print_header "CÀI ĐẶT HOÀN TẤT"
print_success "Tạp chí Khoa học Hậu cần Quân sự đã được cài đặt thành công!"
echo ""
print_message "$BLUE" "Thông tin truy cập:"
if [ ! -z "$DOMAIN" ]; then
    print_message "$GREEN" "  URL: $NEXTAUTH_URL"
else
    print_message "$GREEN" "  URL: http://localhost:$APP_PORT"
fi
print_message "$GREEN" "  Admin Email: admin@tapchi-hcqs.vn"
print_message "$GREEN" "  Admin Password: Admin@123"
echo ""
print_message "$YELLOW" "  LƯU Ý: Đổi mật khẩu ngay sau khi đăng nhập!"
echo ""
print_message "$BLUE" "Các lệnh hữu ích:"
print_message "$GREEN" "  - Xem logs: sudo journalctl -u $APP_NAME -f"
print_message "$GREEN" "  - Khởi động lại: sudo systemctl restart $APP_NAME"
print_message "$GREEN" "  - Dừng ứng dụng: sudo systemctl stop $APP_NAME"
print_message "$GREEN" "  - Kiểm tra trạng thái: sudo systemctl status $APP_NAME"
print_message "$GREEN" "  - Backup thủ công: $APP_DIR/scripts/auto-backup.sh"
echo ""
print_message "$BLUE" "Thông tin chi tiết đã được lưu tại: $APP_DIR/CREDENTIALS.txt"
echo ""
