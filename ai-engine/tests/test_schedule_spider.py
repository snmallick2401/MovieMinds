import pytest
from datetime import datetime, timezone
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.schedule_spider import scrape_schedules
from scraper.db import get_db_connection

@pytest.fixture(scope="function")
def seed_mock_media(test_run_id):
    """Seeds a mock media record for the schedule spider to update."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute(
                """
                INSERT INTO media (id, title, "mediaType", status, "releaseDate", "createdAt", "updatedAt", source, "sourceId")
                VALUES (%s, %s, 'ANIME', 'UPCOMING', NULL, NOW(), NOW(), 'TMDB', %s)
                """,
                (f"mock_media_{test_run_id}", f"Upcoming Anime {test_run_id}", f"src_{test_run_id}")
            )
        conn.commit()
    finally:
        conn.close()

def test_schedule_spider_updates_db(test_run_id, seed_mock_media, db_cleanup):
    """Tests that the spider successfully updates existing media records."""
    release_date = datetime.now(timezone.utc)
    
    mock_updates = [
        {
            "title": f"Upcoming Anime {test_run_id}",
            "status": "AIRING",
            "releaseDate": release_date
        }
    ]
    
    # Execute with mocked data
    scrape_schedules(schedule_updates=mock_updates)
    
    # Validate DB Update
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("SELECT status, \"releaseDate\" FROM media WHERE id = %s", (f"mock_media_{test_run_id}",))
            media = cursor.fetchone()
            
            assert media is not None
            assert media['status'] == "AIRING"
            assert media['releaseDate'] is not None
            # Compare up to the minute to avoid microsecond timezone parsing mismatches
            assert media['releaseDate'].strftime('%Y-%m-%d %H:%M') == release_date.strftime('%Y-%m-%d %H:%M')
    finally:
        conn.close()

def test_schedule_spider_partial_load_no_crash():
    """Tests that the spider doesn't crash if passed empty or partial data."""
    # Should handle empty array gracefully
    scrape_schedules(schedule_updates=[])
    
    # Missing fields should raise an exception so APScheduler can track it as a failure
    with pytest.raises(KeyError):
        scrape_schedules(schedule_updates=[{"title": "Broken Update"}])
