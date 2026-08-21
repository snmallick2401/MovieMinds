import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from .db import get_db_connection

from .logger import get_logger

ANN_RSS_URL = "https://www.animenewsnetwork.com/news/rss.xml"

def scrape_news(run_id: str = None):
    logger = get_logger("news_spider", "scrape_news", run_id)
    logger.info("Starting to scrape Anime News Network")
    
    try:
        response = requests.get(ANN_RSS_URL, timeout=10)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        articles_added = 0
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            import os
            if os.environ.get('TESTING') == '1':
                cursor.execute("SET search_path TO test_schema;")
                
            for item in root.findall('./channel/item'):
                title = item.find('title').text if item.find('title') is not None else "No Title"
                link = item.find('link').text if item.find('link') is not None else ""
                pubDate_str = item.find('pubDate').text if item.find('pubDate') is not None else ""
                description = item.find('description').text if item.find('description') is not None else ""
                
                try:
                    published_at = parsedate_to_datetime(pubDate_str)
                except:
                    published_at = datetime.utcnow()
                
                # Check if exists
                cursor.execute("SELECT id FROM news_articles WHERE url = %s", (link,))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO news_articles (id, source, title, url, summary, "publishedAt")
                        VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s)
                        """,
                        ("AnimeNewsNetwork", title, link, description[:1000], published_at)
                    )
                    articles_added += 1
                    
            conn.commit()
            logger.info(f"Successfully added {articles_added} new articles", extra={"articles_added": articles_added})
            
    except Exception as e:
        logger.error(f"Error scraping news: {e}", extra={"error_type": type(e).__name__})
        raise
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    scrape_news()
