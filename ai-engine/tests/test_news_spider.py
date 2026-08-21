import pytest
import responses
from requests.exceptions import Timeout, HTTPError
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.news_spider import scrape_news, ANN_RSS_URL
from scraper.db import get_db_connection

VALID_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Anime News Network</title>
    <item>
      <title>Test Article {run_id}</title>
      <link>https://www.animenewsnetwork.com/test/{run_id}</link>
      <pubDate>Mon, 15 Aug 2026 12:00:00 -0400</pubDate>
      <description>This is a test summary.</description>
    </item>
  </channel>
</rss>
"""

MALFORMED_RSS = """<?xml version="1.0" encoding="UTF-8"?><rss><broken"""

@responses.activate
def test_news_spider_success(test_run_id, db_cleanup):
    """Tests normal successful parsing and database insertion."""
    xml_data = VALID_RSS.format(run_id=test_run_id)
    responses.add(responses.GET, ANN_RSS_URL, body=xml_data, status=200)

    # Execute
    scrape_news()

    # Validate DB insertion
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("SELECT * FROM news_articles WHERE url = %s", (f"https://www.animenewsnetwork.com/test/{test_run_id}",))
            article = cursor.fetchone()
            assert article is not None
            assert article['title'] == f"Test Article {test_run_id}"
            assert article['summary'] == "This is a test summary."
    finally:
        conn.close()

@responses.activate
def test_news_spider_duplicates(test_run_id, db_cleanup):
    """Tests that running the scraper twice does not insert duplicates."""
    xml_data = VALID_RSS.format(run_id=test_run_id)
    responses.add(responses.GET, ANN_RSS_URL, body=xml_data, status=200)

    scrape_news()
    scrape_news() # Run again

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("SELECT COUNT(*) as count FROM news_articles WHERE url = %s", (f"https://www.animenewsnetwork.com/test/{test_run_id}",))
            result = cursor.fetchone()
            assert result['count'] == 1 # Only one inserted
    finally:
        conn.close()

@responses.activate
def test_news_spider_http_500():
    """Tests resilience against HTTP 500 errors."""
    responses.add(responses.GET, ANN_RSS_URL, status=500)
    # Should raise so the APScheduler listener can count it as a failure
    with pytest.raises(HTTPError):
        scrape_news()

@responses.activate
def test_news_spider_timeout():
    """Tests resilience against network timeouts."""
    responses.add(responses.GET, ANN_RSS_URL, body=Timeout("Connection timed out"))
    # Should handle cleanly
    with pytest.raises(Timeout):
        scrape_news()

@responses.activate
def test_news_spider_malformed_xml():
    """Tests resilience against broken XML feeds."""
    responses.add(responses.GET, ANN_RSS_URL, body=MALFORMED_RSS, status=200)
    # ElementTree parse error should be raised
    import xml.etree.ElementTree as ET
    with pytest.raises(ET.ParseError):
        scrape_news()
