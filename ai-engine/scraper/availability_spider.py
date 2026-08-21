import asyncio
from playwright.async_api import async_playwright
from .db import get_db_connection

from .logger import get_logger

# A robust Playwright scraper for streaming availability
# This spider simulates opening a Javascript-heavy platform to scrape streaming links

async def run_playwright(logger):
    logger.info("Launching headless browser")
    async with async_playwright() as p:
        # Using Chromium headless
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # In a real scenario, you would navigate to JustWatch or Crunchyroll
        # await page.goto("https://www.justwatch.com/")
        # await page.wait_for_selector(".title-poster")
        
        # Simulated scraped data:
        platforms_scraped = [
            {"mediaTitle": "Attack on Titan", "platformName": "Crunchyroll", "watchUrl": "https://crunchyroll.com"}
        ]
        
        await browser.close()
        return platforms_scraped

def scrape_availability(run_id: str = None):
    logger = get_logger("availability_spider", "scrape_availability", run_id)
    logger.info("Starting availability sync")
    
    try:
        results = asyncio.run(run_playwright(logger))
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            import os
            if os.environ.get('TESTING') == '1':
                cursor.execute("SET search_path TO test_schema;")
            
            updates_applied = 0
            for item in results:
                # 1. Ensure platform exists
                cursor.execute(
                    "INSERT INTO streaming_platforms (id, name) VALUES (gen_random_uuid()::text, %s) ON CONFLICT (name) DO NOTHING",
                    (item["platformName"],)
                )
                
                # 2. Get platform ID
                cursor.execute("SELECT id FROM streaming_platforms WHERE name = %s", (item["platformName"],))
                platform = cursor.fetchone()
                if not platform:
                    continue
                    
                # 3. Find Media ID
                cursor.execute("SELECT id FROM media WHERE title = %s", (item["mediaTitle"],))
                media = cursor.fetchone()
                if not media:
                    continue
                    
                # 4. Upsert MediaPlatform relationship
                cursor.execute(
                    """
                    INSERT INTO media_platforms ("mediaId", "platformId", "watchUrl")
                    VALUES (%s, %s, %s)
                    ON CONFLICT ("mediaId", "platformId") 
                    DO UPDATE SET "watchUrl" = EXCLUDED."watchUrl"
                    """,
                    (media["id"], platform["id"], item["watchUrl"])
                )
                updates_applied += 1
                
            conn.commit()
            logger.info(f"Successfully updated {updates_applied} streaming links", extra={"updates_applied": updates_applied})
            
    except Exception as e:
        logger.error(f"Error syncing availability: {e}", extra={"error_type": type(e).__name__})
        raise
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    scrape_availability()
