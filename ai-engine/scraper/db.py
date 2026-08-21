import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Try to load Next.js environment files from the parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# If TESTING=1, prefer .env.test
if os.environ.get('TESTING') == '1':
    load_dotenv(os.path.join(parent_dir, '.env.test'))
    
load_dotenv(os.path.join(parent_dir, '.env.local'))
load_dotenv(os.path.join(parent_dir, '.env'))
load_dotenv() # local .env fallback

def get_db_connection():
    # Prefer DIRECT_URL to avoid connection pooling limits (pgbouncer) for background jobs
    db_url = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
    
    if not db_url:
        raise ValueError("No database URL found in environment variables.")
        
    import urllib.parse
    
    # Parse URL to remove unsupported psycopg2 parameters (like 'schema')
    parsed_url = urllib.parse.urlparse(db_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    
    # Remove schema from params if it exists
    if 'schema' in query_params:
        del query_params['schema']
        
    # Reconstruct query string
    new_query = urllib.parse.urlencode(query_params, doseq=True)
    clean_db_url = urllib.parse.urlunparse(parsed_url._replace(query=new_query))
    
    conn = psycopg2.connect(clean_db_url, cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn
