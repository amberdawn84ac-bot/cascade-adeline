# Database Setup Instructions

To complete the Adeline implementation, you need to enable the pgvector extension and create the new database tables for the Investigation and ShareLink features.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the contents of `database-setup.sql`
5. Click **Run** to execute the script

## Option 2: Using Command Line

If you have psql installed and your DATABASE_URL configured:

```bash
# Run the setup script
psql "$DATABASE_URL" -f database-setup.sql
```

## Option 3: Using the batch script (Windows)

```cmd
# Run the setup batch file
setup-database.bat
```

## After Setup

Once the database is set up:

1. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

2. The application should now have full functionality:
   - ✅ Cognitive load detection
   - ✅ Analogy generation for frustrated students
   - ✅ Proactive opportunity scouting
   - ✅ Collaborative learning with ShareWidget

## Verification

To verify everything is working:

1. Start the development server: `npm run dev`
2. Log in as a student
3. Try asking a complex question in chat (should trigger InvestigationBoard with ShareWidget)
4. Check the dashboard for mission briefings
5. Test cognitive load by typing slowly and making many edits

## Troubleshooting

If you get an error about the "vector" extension:
- Make sure you're running the SQL as a superuser in Supabase
- The extension must be enabled before creating tables with vector columns

If you get foreign key constraint errors:
- Run the script in order - extension first, then tables
- Make sure the "users" table exists (it should in a fresh Adeline install)
