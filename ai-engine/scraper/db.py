import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Try to load Next.js environment files from the parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(parent_dir, '.env.local'))
load_dotenv(os.path.join(parent_dir, '.env'))
load_dotenv() # local .env fallback

def get_db_connection():
    # Prefer DIRECT_URL to avoid connection pooling limits (pgbouncer) for background jobs
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    
    if not db_url:
        raise ValueError("No database URL found in environment variables.")
        
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn
