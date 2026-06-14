# CHANGELOG - TẠP CHÍ KHOA HỌC HẬU CẦN QUÂN SỰ

## [2.0.0] - 08/01/2026

### ✨ Tính Năng Mới

#### Cơ Sở Hạ Tầng
- ✅ Migration từ AWS S3 sang Local Filesystem Storage
- ✅ 100% Internet Independence (Intranet deployment)
- ✅ Systemd service integration
- ✅ Nginx reverse proxy setup
- ✅ Automatic backup system (daily at 2 AM)
- ✅ UFW firewall configuration
- ✅ Fail2ban security integration

#### Giao Diện Người Dùng
- ✅ Redesigned Homepage (2/3 + 1/3 grid layout)
- ✅ Modern section headers with gradient colors
- ✅ Image-only slider (5s auto-play)
- ✅ Featured News, Latest News, Latest Articles
- ✅ Most Viewed Articles section
- ✅ Latest Issues sidebar (4 items)
- ✅ Announcements panel
- ✅ Trending Topics
- ✅ Featured Authors
- ✅ System Statistics panel

#### Kho Bài Báo (Article Repository)
- ✅ Public repository interface with hero banner
- ✅ Advanced search with multiple filters
- ✅ Article detail pages with PDF viewer
- ✅ Access control (login required for full-text)
- ✅ Admin dashboard for article management
- ✅ "Sync from Workflow" feature
- ✅ Manual article creation/editing
- ✅ Statistics tracking
- ✅ Secure download with audit logging

#### Quy Trình Xuất Bản
- ✅ 7-step publishing workflow
- ✅ Editor Dashboard with Kanban board
- ✅ Reviewer management with performance metrics
- ✅ Author submission pipeline
- ✅ Workflow timeline visualization
- ✅ Version comparison tool
- ✅ Blind review support (Single/Double Blind)

#### Kiểm Tra Đạo Văn
- ✅ Plagiarism detection module
- ✅ Similarity algorithms
- ✅ Visualization components
- ✅ Report generation
- ✅ Database schema updates

#### Tự Động Hóa
- ✅ Deadline reminder system
- ✅ Cron job for email notifications
- ✅ Automatic backup scheduling
- ✅ Database maintenance tasks

#### Thống Kê & Phân Tích
- ✅ Statistics Overview page
- ✅ Detailed Analytics page
- ✅ Charts with Recharts library
- ✅ Real-time metrics
- ✅ Performance dashboards

#### CMS (Content Management System)
- ✅ WordPress-like page editor
- ✅ Rich text editor (Vietnamese + English)
- ✅ SEO settings (meta title, description, OG image)
- ✅ Auto-save functionality (30s interval)
- ✅ Unsaved changes warning
- ✅ Quick actions (Preview, Refresh, View public)
- ✅ Publish/Draft toggle
- ✅ Template selection
- ✅ News management
- ✅ Banner/Slider management
- ✅ Navigation menu management

#### PDF Viewer
- ✅ Integrated PDF viewer using @react-pdf-viewer
- ✅ Full-featured toolbar
- ✅ Download functionality
- ✅ Expand/Collapse controls
- ✅ Security watermark for reviews
- ✅ Local PDF worker (no CDN dependency)

#### Phân Quyền (RBAC)
- ✅ 9 vai trò: Reader, Author, Reviewer, Editor, Managing Editor, EIC, Layout Editor, SYSADMIN, Security Auditor
- ✅ Granular permissions
- ✅ Role-based dashboard
- ✅ Dynamic menu based on roles

### 🔧 Cải Tiến

#### Hiệu Suất
- ✅ Optimized database queries
- ✅ Promise.all for parallel operations
- ✅ Lazy loading components
- ✅ Image optimization
- ✅ Build optimization

#### Bảo Mật
- ✅ Enhanced authentication with NextAuth
- ✅ 2FA support
- ✅ Session management
- ✅ Audit logging for all actions
- ✅ IP tracking
- ✅ Secure file downloads
- ✅ CSRF protection

#### UI/UX
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Dark mode support
- ✅ Loading states with spinners
- ✅ Toast notifications (Sonner)
- ✅ Better error messages
- ✅ Breadcrumb navigation
- ✅ Improved sidebar with auto-collapse

#### Developer Experience
- ✅ TypeScript for type safety
- ✅ Zod validation schemas
- ✅ Prisma ORM
- ✅ ESLint configuration
- ✅ Environment variables validation

### 🐛 Sửa Lỗi

- ✅ Fixed advanced search API (affiliation -> org field)
- ✅ Fixed sessions management API (ip/ipAddress mapping)
- ✅ Fixed PDF viewer "fake worker" error
- ✅ Fixed hydration errors
- ✅ Fixed build errors with Prisma schema
- ✅ Fixed authentication issues
- ✅ Fixed file upload 401 errors
- ✅ Fixed image loading issues
- ✅ Fixed broken links in footer

### 📚 Tài Liệu

- ✅ SYSTEM_REPORT.md (8,000 lines, 45,000 words)
- ✅ USER_GUIDE_SYSADMIN.md (5,000 lines, 30,000 words)
- ✅ Deployment README.md
- ✅ QUICK_START.md
- ✅ .env.example with detailed comments
- ✅ API documentation
- ✅ Troubleshooting guide

### 🛠️ Scripts

- ✅ setup.sh - Full installation script
- ✅ uninstall.sh - Clean removal script
- ✅ update.sh - Application update script
- ✅ check-requirements.sh - System requirements checker
- ✅ auto-backup.sh - Automated backup script

### 💬 Thay Đổi Khác

- ✅ Migrated from npm to yarn
- ✅ Updated dependencies to latest versions
- ✅ Removed AWS S3 dependencies
- ✅ Simplified deployment process
- ✅ Improved error handling
- ✅ Better logging system

---

## [1.0.0] - Initial Release

### Tính Năng Cơ Bản

- ✅ User registration and authentication
- ✅ Article submission
- ✅ Peer review process
- ✅ Editorial workflow
- ✅ Issue management
- ✅ Article publishing
- ✅ Basic search
- ✅ User dashboard
- ✅ Admin panel

---

**Chú thích:**
- ✨ Tính năng mới
- 🔧 Cải tiến
- 🐛 Sửa lỗi
- 📚 Tài liệu
- 🛠️ Công cụ
- ⚠️ Thay đổi quan trọng
- 🛡️ Bảo mật
