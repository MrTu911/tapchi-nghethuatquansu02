-- CreateTable: WorkflowStepConfig
-- Thay thế deadline hard-code bằng cấu hình động per DeadlineType

CREATE TABLE "WorkflowStepConfig" (
    "id"           TEXT NOT NULL,
    "stepType"     TEXT NOT NULL,
    "label"        TEXT NOT NULL,
    "deadlineDays" INTEGER NOT NULL,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "maxReminders" INTEGER NOT NULL DEFAULT 2,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "updatedBy"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStepConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStepConfig_stepType_key" ON "WorkflowStepConfig"("stepType");
CREATE INDEX "WorkflowStepConfig_stepType_idx" ON "WorkflowStepConfig"("stepType");
CREATE INDEX "WorkflowStepConfig_isActive_idx" ON "WorkflowStepConfig"("isActive");

-- Seed: giá trị mặc định cho 6 bước (bảo toàn behavior cũ)
INSERT INTO "WorkflowStepConfig" ("id", "stepType", "label", "deadlineDays", "reminderDays", "maxReminders", "isActive", "updatedAt")
VALUES
    (gen_random_uuid(), 'INITIAL_REVIEW',   N'Phản biện ban đầu',           21, 3, 2, true, NOW()),
    (gen_random_uuid(), 'REVISION_SUBMIT',  N'Tác giả nộp bản sửa',         14, 3, 2, true, NOW()),
    (gen_random_uuid(), 'RE_REVIEW',        N'Phản biện lại sau sửa',        14, 3, 2, true, NOW()),
    (gen_random_uuid(), 'EDITOR_DECISION',  N'Biên tập viên ra quyết định',   7, 3, 2, true, NOW()),
    (gen_random_uuid(), 'PRODUCTION',       N'Sản xuất / Dàn trang',          14, 3, 2, true, NOW()),
    (gen_random_uuid(), 'PUBLICATION',      N'Xuất bản chính thức',            7, 3, 2, true, NOW())
ON CONFLICT ("stepType") DO NOTHING;
