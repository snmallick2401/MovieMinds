import pytest
from unittest.mock import patch
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.availability_spider import scrape_availability
from scraper.db import get_db_connection

@pytest.fixture(scope="function")
def seed_mock_media(test_run_id):
    """Seeds a mock media record for the availability spider to link."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute(
                """
                INSERT INTO media (id, title, "mediaType", status, "createdAt", "updatedAt", source, "sourceId")
                VALUES (%s, %s, 'ANIME', 'UPCOMING', NOW(), NOW(), 'TMDB', %s)
                """,
                (f"mock_media_{test_run_id}", f"Availability Anime {test_run_id}", f"src_{test_run_id}")
            )
        conn.commit()
    finally:
        conn.close()

def test_availability_spider_inserts_links(test_run_id, seed_mock_media, db_cleanup):
    """Tests that the playwright wrapper fetches links and inserts streaming platforms."""
    # We will mock `run_playwright` so we don't have to launch a browser in this unit test.
    # The actual playwright execution is a blackbox but we test DB logic here.
    
    mock_results = [
        {
            "mediaTitle": f"Availability Anime {test_run_id}",
            "platformName": f"CrunchyTest {test_run_id}",
            "watchUrl": f"https://crunchyroll.com/test/{test_run_id}"
        }
    ]
    
    with patch('scraper.availability_spider.run_playwright') as mock_run_pw:
        mock_run_pw.return_value = mock_results
        scrape_availability()
        
    # Validate DB Insertions
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            
            # Check Platform
            cursor.execute("SELECT id FROM streaming_platforms WHERE name = %s", (f"CrunchyTest {test_run_id}",))
            platform = cursor.fetchone()
            assert platform is not None
            
            # Check MediaPlatform
            cursor.execute("SELECT * FROM media_platforms WHERE \"platformId\" = %s AND \"mediaId\" = %s", 
                           (platform['id'], f"mock_media_{test_run_id}"))
            media_platform = cursor.fetchone()
            assert media_platform is not None
            assert media_platform['watchUrl'] == f"https://crunchyroll.com/test/{test_run_id}"
    finally:
        conn.close()

def test_availability_spider_exception_handling():
    """Tests that the spider catches HTTP 500 or timeout exceptions gracefully."""
    with patch('scraper.availability_spider.run_playwright') as mock_run_pw:
        mock_run_pw.side_effect = Exception("Playwright Timeout Error")
        
        # Should raise so the APScheduler listener can count it as a failure
        with pytest.raises(Exception):
            scrape_availability()
