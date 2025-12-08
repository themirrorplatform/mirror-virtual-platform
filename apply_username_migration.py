#!/usr/bin/env python3
"""
Apply Username Migration to Supabase Database
Adds the username column to public.profiles table
"""
import asyncio
import asyncpg
import os
from pathlib import Path

# Your Supabase connection string
DATABASE_URL = "postgresql://postgres.bfctvwjxlfkzeahmscbe:@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

async def apply_migration():
    """Apply the username migration to the database."""
    
    # Read the migration file
    migration_path = Path(__file__).parent / "supabase" / "migrations" / "ADD_USERNAME_TO_PROFILES.sql"
    
    print(f"📂 Reading migration from: {migration_path}")
    
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        return
    
    with open(migration_path, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print(f"📝 Migration SQL loaded ({len(migration_sql)} characters)")
    print("\n" + "="*80)
    print("CONNECTING TO DATABASE")
    print("="*80)
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to Supabase database")
        
        # Check current PostgreSQL version
        version = await conn.fetchval("SELECT version()")
        print(f"📊 PostgreSQL version: {version}")
        
        print("\n" + "="*80)
        print("CHECKING CURRENT TABLE STRUCTURE")
        print("="*80)
        
        # Check if profiles table exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'profiles'
            )
        """)
        
        if not table_exists:
            print("⚠️  WARNING: public.profiles table does not exist!")
            print("   You need to apply base migrations first (001_mirror_core.sql)")
            await conn.close()
            return
        
        print("✅ public.profiles table exists")
        
        # Check if username column exists
        username_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'username'
            )
        """)
        
        if username_exists:
            print("ℹ️  Username column already exists")
        else:
            print("⚠️  Username column is MISSING (will be added)")
        
        # Show current columns
        current_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles'
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Current columns in public.profiles:")
        for col in current_columns:
            print(f"   - {col['column_name']}: {col['data_type']} "
                  f"(nullable: {col['is_nullable']}, default: {col['column_default']})")
        
        print("\n" + "="*80)
        print("APPLYING MIGRATION")
        print("="*80)
        
        # Apply the migration
        await conn.execute(migration_sql)
        print("✅ Migration applied successfully!")
        
        print("\n" + "="*80)
        print("VERIFYING CHANGES")
        print("="*80)
        
        # Verify username column now exists
        username_exists_after = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'username'
            )
        """)
        
        if username_exists_after:
            print("✅ Username column successfully added!")
            
            # Get username column details
            username_info = await conn.fetchrow("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'username'
            """)
            
            print(f"   Column details: {username_info['data_type']}, "
                  f"nullable: {username_info['is_nullable']}, "
                  f"default: {username_info['column_default']}")
            
            # Check if index was created
            index_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public'
                    AND tablename = 'profiles'
                    AND indexname = 'idx_profiles_username'
                )
            """)
            
            if index_exists:
                print("✅ Index idx_profiles_username created")
            else:
                print("⚠️  Index idx_profiles_username not found")
            
            # Check for unique constraint
            unique_constraint = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage ccu 
                        ON tc.constraint_name = ccu.constraint_name
                    WHERE tc.table_schema = 'public'
                    AND tc.table_name = 'profiles'
                    AND ccu.column_name = 'username'
                    AND tc.constraint_type = 'UNIQUE'
                )
            """)
            
            if unique_constraint:
                print("✅ UNIQUE constraint on username exists")
            else:
                print("⚠️  UNIQUE constraint on username not found")
        else:
            print("❌ FAILED: Username column was not added")
        
        print("\n" + "="*80)
        print("FINAL TABLE STRUCTURE")
        print("="*80)
        
        # Show final table structure
        final_columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'profiles'
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Final public.profiles structure:")
        for col in final_columns:
            marker = "🆕" if col['column_name'] == 'username' else "  "
            print(f"{marker} - {col['column_name']}: {col['data_type']} "
                  f"(nullable: {col['is_nullable']}, default: {col['column_default']})")
        
        await conn.close()
        print("\n" + "="*80)
        print("✅ MIGRATION COMPLETE")
        print("="*80)
        print("\n📝 Next steps:")
        print("   1. Run tests again: cd core-api && python -m pytest tests/ -v")
        print("   2. Check if more migrations are needed")
        print("   3. Fix authentication issues in tests")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*80)
    print("SUPABASE MIGRATION: ADD USERNAME TO public.profiles")
    print("="*80)
    print(f"Database: {DATABASE_URL[:50]}...")
    print()
    
    asyncio.run(apply_migration())
