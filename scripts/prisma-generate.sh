#!/bin/bash
# Prisma generate script that provides a placeholder DATABASE_URL if not set
# This allows the Prisma client to be generated during build without needing a real database connection

if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
fi

prisma generate
