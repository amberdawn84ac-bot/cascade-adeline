@echo off
echo Setting up Adeline database...

REM Step 1: Enable pgvector extension
echo Enabling pgvector extension...
psql "%DATABASE_URL%" -c "CREATE EXTENSION IF NOT EXISTS vector;"

if %errorlevel% neq 0 (
    echo ❌ Failed to enable pgvector extension
    pause
    exit /b 1
)

echo ✅ pgvector extension enabled successfully

REM Step 2: Generate Prisma client
echo Generating Prisma client...
npx prisma generate

REM Step 3: Run migrations
echo Running database migrations...
npx prisma migrate dev --name add-investigation-and-share-models

if %errorlevel% neq 0 (
    echo ❌ Migration failed. Please check the error above.
    pause
    exit /b 1
)

echo ✅ Database migrations completed successfully
echo 🎉 Adeline database is ready!
pause
