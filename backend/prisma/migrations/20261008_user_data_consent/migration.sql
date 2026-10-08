-- UU PDP No. 27/2022 Bab 11.2: explicit consent timestamp and policy version.
-- Additive only. No existing data is modified.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataConsentVersion" TEXT;
