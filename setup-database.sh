#!/bin/bash

echo "Setting up Adeline database..."

# Step 1: Enable pgvector extension
echo "Enabling pgvector extension..."
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"

if [ $? -eq 0 ]; then
    echo "✅ pgvector extension enabled successfully"
else
    echo "❌ Failed to enable pgvector extension"
    exit 1
fi

# Step 2: Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Step 3: Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name add-investigation-and-share-models

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
    echo "🎉 Adeline database is ready!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
