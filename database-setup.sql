-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add SourceType enum value if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CURATED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SourceType')) THEN
        ALTER TYPE "SourceType" ADD VALUE 'CURATED';
    END IF;
END $$;

-- Step 3: Create Investigation model
CREATE TABLE IF NOT EXISTS "investigations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- Step 6: Add foreign key constraints
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investigation_sources" ADD CONSTRAINT "investigation_sources_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "share_links" ADD CONSTRAINT "share_links_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
