-- Backfill: tạo SubmissionVersion v1 cho các bài nộp cũ chưa có version nào.
-- Idempotent: WHERE NOT EXISTS đảm bảo chạy lại nhiều lần không nhân đôi.
-- filesetId lấy từ file MANUSCRIPT sớm nhất của bài (nếu có), nếu không để rỗng.
INSERT INTO "SubmissionVersion" (id, "submissionId", "versionNo", "filesetId", changelog, "createdAt")
SELECT
  gen_random_uuid()::text,
  s.id,
  1,
  COALESCE(
    (SELECT uf."cloudStoragePath"
       FROM "UploadedFile" uf
      WHERE uf."submissionId" = s.id AND uf."fileType" = 'MANUSCRIPT'
      ORDER BY uf."createdAt" ASC
      LIMIT 1),
    ''
  ),
  'Bản thảo gốc (backfill)',
  s."createdAt"
FROM "Submission" s
WHERE NOT EXISTS (
  SELECT 1 FROM "SubmissionVersion" v WHERE v."submissionId" = s.id
);
