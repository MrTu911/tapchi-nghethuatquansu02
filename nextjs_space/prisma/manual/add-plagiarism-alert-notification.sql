-- Thêm value 'PLAGIARISM_ALERT' vào enum NotificationType để phục vụ cảnh báo đạo văn
-- tự động (chạy khi nộp bài / khi vào phản biện) gửi cho biên tập viên.
--
-- Quy ước repo: DB là db-push và DÙNG CHUNG với checkout khác → KHÔNG `prisma db push`.
-- Vá bằng SQL thủ công idempotent qua `prisma db execute`.
--
-- Lưu ý: ALTER TYPE ... ADD VALUE không chạy trong transaction block ở một số phiên bản
-- PostgreSQL. `prisma db execute` chạy file này ngoài transaction nên an toàn.
-- IF NOT EXISTS đảm bảo chạy lại nhiều lần không lỗi.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PLAGIARISM_ALERT';
