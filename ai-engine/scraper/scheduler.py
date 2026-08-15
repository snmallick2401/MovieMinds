from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
import time
import os
import sys

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.news_spider import scrape_news
from scraper.schedule_spider import scrape_schedules
from scraper.availability_spider import scrape_availability

def start_scheduler():
    print("=========================================")
    print("Starting MovieMinds Automated Data Pipeline")
    print("=========================================")
    
    scheduler = BlockingScheduler()
    
    # Run once immediately on startup
    try:
        print("[Scheduler] Running initial boot sequence...")
        scrape_news()
        scrape_schedules()
        scrape_availability()
    except Exception as e:
        print(f"[Scheduler] Initial boot error: {e}")
        
    # 1. Scrape News every hour
    scheduler.add_job(
        scrape_news,
        trigger=IntervalTrigger(hours=1),
        id='scrape_news_job',
        name='Scrape Anime News Network',
        replace_existing=True
    )
    
    # 2. Scrape Release Schedules every 12 hours
    scheduler.add_job(
        scrape_schedules,
        trigger=IntervalTrigger(hours=12),
        id='scrape_schedules_job',
        name='Scrape Media Release Schedules',
        replace_existing=True
    )
    
    # 3. Scrape Streaming Availability daily
    scheduler.add_job(
        scrape_availability,
        trigger=IntervalTrigger(days=1),
        id='scrape_availability_job',
        name='Scrape Playwright Streaming Availability',
        replace_existing=True
    )
    
    print("[Scheduler] All jobs scheduled successfully. Listening for events...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n[Scheduler] Shutting down gracefully...")

if __name__ == "__main__":
    start_scheduler()
