"""
Direct database migration script
CLEAN MIGRATION: Drops existing tables and runs fresh schema
"""
import asyncio
import asyncpg

async def run_migration():
    DATABASE_URL = "postgresql://postgres:C0EjXbBdjaAsZ5yU@db.enfjnqfppfhofredyxyg.supabase.co:5432/postgres"
    
    # Read migration file
    with open(r"c:\Users\ilyad\mirror-virtual-platform\supabase\migrations\100_complete_unified_migration.sql", "r", encoding="utf-8") as f:
        migration_sql = f.read()
    
    print("🔥 CLEAN MIGRATION MODE - This will drop existing tables!")
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Get existing tables
        print("\nStep 1: Checking existing tables...")
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        if tables:
            print(f"Found {len(tables)} existing tables:")
            for table in tables:
                print(f"  - {table['table_name']}")
            
            print("\nStep 2: Backing up existing data (export to JSON)...")
            # Backup critical tables
            backup_data = {}
            for table_name in ['profiles', 'reflections', 'mx_users', 'mx_reflections', 'mx_mirrorbacks']:
                try:
                    rows = await conn.fetch(f"SELECT * FROM public.{table_name}")
                    if rows:
                        backup_data[table_name] = [dict(row) for row in rows]
                        print(f"  ✅ Backed up {len(rows)} rows from {table_name}")
                except:
                    print(f"  ⚠️  Table {table_name} not found or empty")
            
            # Save backup to file
            import json
            import datetime
            backup_file = f"database_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, default=str, indent=2)
            print(f"\n✅ Backup saved to: {backup_file}")
            
            print("\nStep 3: Dropping existing tables (CASCADE)...")
            drop_sql = "DROP TABLE IF EXISTS " + ", ".join([f"public.{t['table_name']}" for t in tables]) + " CASCADE;"
            await conn.execute(drop_sql)
            print("✅ All existing tables dropped")
        else:
            print("No existing tables found. Clean database.")
        
        print("\nStep 4: Dropping existing ENUMs and types...")
        await conn.execute("""
            DROP TYPE IF EXISTS reflection_visibility CASCADE;
            DROP TYPE IF EXISTS reflection_tone CASCADE;
            DROP TYPE IF EXISTS mirrorback_source CASCADE;
            DROP TYPE IF EXISTS safety_severity CASCADE;
            DROP TYPE IF EXISTS regression_type CASCADE;
            DROP TYPE IF EXISTS signal_type CASCADE;
        """)
        print("✅ Existing types dropped")
        
        print("\nStep 5: Running complete unified migration...")
        # Execute migration
        await conn.execute(migration_sql)
        print("✅ Migration completed successfully!")
        
        # Check created tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        print(f"\n✅ Created {len(tables)} tables:")
        for table in tables:
            print(f"  - {table['table_name']}")
            
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        await conn.close()
        print("\nDatabase connection closed.")

if __name__ == "__main__":
    asyncio.run(run_migration())
