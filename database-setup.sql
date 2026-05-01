-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create SourceType enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SourceType') THEN
        CREATE TYPE "SourceType" AS ENUM ('PRIMARY', 'CURATED', 'SECONDARY', 'MAINSTREAM');
    END IF;
END $$;

-- Step 3: Create Investigation model
CREATE TABLE IF NOT EXISTS "investigations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create InvestigationSource model
CREATE TABLE IF NOT EXISTS "investigation_sources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_sources_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create ShareLink model
CREATE TABLE IF NOT EXISTS "share_links" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- Step 6: Add foreign key constraints
ALTER TABLE "investigations" DROP CONSTRAINT IF EXISTS "investigations_userId_fkey";
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investigation_sources" DROP CONSTRAINT IF EXISTS "investigation_sources_investigationId_fkey";
ALTER TABLE "investigation_sources" ADD CONSTRAINT "investigation_sources_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "share_links" DROP CONSTRAINT IF EXISTS "share_links_investigationId_fkey";
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "share_links" DROP CONSTRAINT IF EXISTS "share_links_createdBy_fkey";
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Update User model relations
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "investigations" TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdShareLinks" TEXT[];

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS "investigations_userId_idx" ON "investigations"("userId");
CREATE INDEX IF NOT EXISTS "investigation_sources_investigationId_idx" ON "investigation_sources"("investigationId");
CREATE INDEX IF NOT EXISTS "share_links_investigationId_idx" ON "share_links"("investigationId");
CREATE INDEX IF NOT EXISTS "share_links_createdBy_idx" ON "share_links"("createdBy");
CREATE INDEX IF NOT EXISTS "share_links_expiresAt_idx" ON "share_links"("expiresAt");

-- Step 9: Enable Row Level Security (RLS)
ALTER TABLE "investigations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "investigation_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "share_links" ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for investigations
-- Users can only view their own investigations
CREATE POLICY "Users can view own investigations"
ON "investigations" FOR SELECT
USING (auth.uid()::text = "userId"::text);

-- Users can only insert their own investigations
CREATE POLICY "Users can insert own investigations"
ON "investigations" FOR INSERT
WITH CHECK (auth.uid()::text = "userId"::text);

-- Users can only update their own investigations
CREATE POLICY "Users can update own investigations"
ON "investigations" FOR UPDATE
USING (auth.uid()::text = "userId"::text);

-- Users can only delete their own investigations
CREATE POLICY "Users can delete own investigations"
ON "investigations" FOR DELETE
USING (auth.uid()::text = "userId"::text);

-- Step 11: Create RLS policies for investigation_sources
-- Users can only view sources from their own investigations
CREATE POLICY "Users can view own investigation sources"
ON "investigation_sources" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "investigations"
    WHERE "investigations".id = "investigation_sources"."investigationId"
    AND "investigations"."userId"::text = auth.uid()::text
  )
);

-- Users can only insert sources for their own investigations
CREATE POLICY "Users can insert own investigation sources"
ON "investigation_sources" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "investigations"
    WHERE "investigations".id = "investigation_sources"."investigationId"
    AND "investigations"."userId"::text = auth.uid()::text
  )
);

-- Step 12: Create RLS policies for share_links
-- Users can only view share links they created
CREATE POLICY "Users can view own share links"
ON "share_links" FOR SELECT
USING (auth.uid()::text = "createdBy"::text);

-- Users can only insert their own share links
CREATE POLICY "Users can insert own share links"
ON "share_links" FOR INSERT
WITH CHECK (auth.uid()::text = "createdBy"::text);

-- Users can only update their own share links
CREATE POLICY "Users can update own share links"
ON "share_links" FOR UPDATE
USING (auth.uid()::text = "createdBy"::text);

-- Users can only delete their own share links
CREATE POLICY "Users can delete own share links"
ON "share_links" FOR DELETE
USING (auth.uid()::text = "createdBy"::text);
