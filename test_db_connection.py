import psycopg2
import sys

try:
    print("🔍 Attempting to connect to database...")
    print(f"   Host: localhost")
    print(f"   Port: 5432")
    print(f"   Database: pbl_development")
    print(f"   User: pbl_admin")
    
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='pbl_development',
        user='pbl_admin',
        password='PBLSensa2024!Strong',
        connect_timeout=5
    )
    print("✅ Connection successful!")
    
    # Try a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    print(f"📊 PostgreSQL version: {version}")
    
    cursor.close()
    conn.close()
    print("✅ Connection closed successfully")
    
except psycopg2.OperationalError as e:
    print(f"❌ OperationalError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print(f"   Error type: {type(e).__name__}")
    sys.exit(1)
