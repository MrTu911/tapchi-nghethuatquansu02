-- Add public view counter to Issue (additive, non-destructive)
ALTER TABLE "Issue" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
