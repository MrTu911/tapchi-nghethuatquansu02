-- ============================================================
-- init-db.sql — Khởi tạo extensions cần thiết cho PostgreSQL
-- Chạy tự động khi container postgres khởi động lần đầu
-- ============================================================

-- Full-text search tiếng Việt (dùng pg_trgm cho similarity search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Đặt timezone mặc định là Hà Nội
SET timezone = 'Asia/Ho_Chi_Minh';
