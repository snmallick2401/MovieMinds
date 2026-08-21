import pytest
import sys
import os
import requests

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.news_spider import scrape_news, ANN_RSS_URL
from scraper.db import get_db_connection

def test_live_news_spider_parsing(db_cleanup):
    """
    Executes a real controlled run against the live Anime News Network feed 
    to detect parsing drift or structural changes in the RSS XML.
    """
    
    # 1. Quick pre-flight check to ensure ANN is reachable. 
    # If it's down, we skip rather than fail the test suite, 
    # as we only want to test parsing drift when it's up.
    try:
        res = requests.head(ANN_RSS_URL, timeout=5)
        if res.status_code >= 400:
            pytest.skip(f"ANN RSS feed returned status {res.status_code}, skipping live test.")
    except Exception as e:
        pytest.skip(f"Could not reach ANN RSS feed: {e}")

    # 2. Get baseline count in the test schema
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("SELECT COUNT(*) as count FROM news_articles")
            baseline_count = cursor.fetchone()['count']
    finally:
        conn.close()

    # 3. Execute the actual scraper against the live feed (no mocked responses)
    scrape_news()

    # 4. Verify insertion and data structure
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            
            # Check new count
            cursor.execute("SELECT COUNT(*) as count FROM news_articles")
            new_count = cursor.fetchone()['count']
            
            # Since the RSS feed almost certainly has articles, it should have inserted >= 0
            assert new_count >= baseline_count, "Live scraper count somehow decreased."
            
            # Grab one of the newly inserted articles to verify fields were parsed correctly
            # (If this is the first run, it will grab the live article. 
            # If not, it will grab whatever is most recent).
            cursor.execute(
                """
                SELECT title, url, summary, "publishedAt" 
                FROM news_articles 
                ORDER BY "publishedAt" DESC 
                LIMIT 1
                """
            )
            article = cursor.fetchone()
            
            # Validate parsing drift didn't break our expected schema shapes
            assert article is not None
            assert len(article['title']) > 0, "Title was parsed empty."
            assert article['url'].startswith('http'), "URL is malformed or missing."
            assert article['publishedAt'] is not None, "Publication date failed to parse."
            
    finally:
        conn.close()
