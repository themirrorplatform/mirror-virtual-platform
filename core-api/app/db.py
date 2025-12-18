"""
Database connection and utilities for The Mirror Virtual Platform.
Connects to Supabase PostgreSQL database.
"""
import os
from typing import Optional
from contextlib import asynccontextmanager
import asyncpg
from asyncpg.pool import Pool

# Database connection pool
_pool: Optional[Pool] = None


async def init_db():
    """Initialize database connection pool."""
    global _pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    _pool = await asyncpg.create_pool(
        database_url,
        min_size=2,
        max_size=10,
        command_timeout=60
    )
    print("✓ Database connection pool initialized")


async def close_db():
    """Close database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        print("✓ Database connection pool closed")


def get_pool() -> Pool:
    """Get the database connection pool."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_db() first.")
    return _pool

async def get_db():
    """
    Dependency for FastAPI routes that returns a database connection.
    Usage: db = Depends(get_db)
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        yield conn

@asynccontextmanager
async def get_db_connection():
    """
    Context manager for database connections.

    Usage:
        async with get_db_connection() as conn:
            result = await conn.fetch("SELECT * FROM profiles")
    """
    pool = get_pool()
    async with pool.acquire() as connection:
        yield connection


async def execute_query(query: str, *args):
    """Execute a query and return results."""
    async with get_db_connection() as conn:
        return await conn.fetch(query, *args)


async def execute_one(query: str, *args):
    """Execute a query and return single result."""
    async with get_db_connection() as conn:
        return await conn.fetchrow(query, *args)


async def execute_command(query: str, *args):
    """Execute a command (INSERT, UPDATE, DELETE) and return status."""
    async with get_db_connection() as conn:
        return await conn.execute(query, *args)


async def get_connection():
    """
    Get a database connection from the pool.
    Note: Caller is responsible for releasing the connection.
    Prefer using get_db_connection() context manager instead.
    """
    pool = get_pool()
    return await pool.acquire()
