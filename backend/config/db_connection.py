"""
Database Connection Pool

Manages PostgreSQL connection pool using asyncpg.
"""

import logging
from typing import Optional
import asyncpg
from config.database import get_database_config

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Database connection pool manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.config = get_database_config()
    
    async def connect(self):
        """Create database connection pool"""
        if not self.config.is_configured():
            logger.warning("⚠️  Database not configured - skipping connection")
            return False
        
        try:
            logger.info("🔌 Connecting to database...")
            self.pool = await asyncpg.create_pool(
                self.config.connection_string,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ Database connection pool created")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to database: {e}")
            return False
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def execute(self, query: str, *args):
        """Execute a query"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args):
        """Fetch multiple rows"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """Fetch single row"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """Fetch single value"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self.pool is not None


# Singleton instance
_db_connection: Optional[DatabaseConnection] = None


def get_db_connection() -> DatabaseConnection:
    """Get or create database connection singleton"""
    global _db_connection
    if _db_connection is None:
        _db_connection = DatabaseConnection()
    return _db_connection
