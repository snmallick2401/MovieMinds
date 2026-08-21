from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, JobExecutionEvent
import time
import os
import sys
import uuid
from datetime import datetime, timezone

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.news_spider import scrape_news
from scraper.schedule_spider import scrape_schedules
from scraper.availability_spider import scrape_availability
from scraper.logger import get_logger

# Prometheus Metrics
from prometheus_client import start_http_server, Counter, Gauge, Summary

# Define metrics
job_duration_seconds = Summary('job_duration_seconds', 'Time spent processing job', ['job_name'])
job_success_total = Counter('job_success_total', 'Total successful job executions', ['job_name'])
job_failure_total = Counter('job_failure_total', 'Total failed job executions', ['job_name'])
consecutive_failures_gauge = Gauge('consecutive_failures', 'Number of consecutive failures per job', ['job_name'])

# Observability Configuration
ALERT_FAILURE_THRESHOLD = int(os.environ.get("ALERT_FAILURE_THRESHOLD", "3"))
ALERT_DURATION_THRESHOLD_MS = int(os.environ.get("ALERT_DURATION_THRESHOLD_MS", "300000"))

# State Tracking
job_state = {}

def get_job_state(job_id: str):
    if job_id not in job_state:
        job_state[job_id] = {
            "consecutive_failures": 0,
            "last_start_time": None
        }
    return job_state[job_id]

def heartbeat():
    logger = get_logger("scheduler", "heartbeat")
    logger.info("scheduler_alive")

# We use wrapper functions so we can inject a run_id
def run_with_observability(job_func, job_name: str, job_id: str):
    run_id = str(uuid.uuid4())
    logger = get_logger("scheduler", job_name, run_id)
    state = get_job_state(job_id)
    
    state["last_start_time"] = time.time()
    
    logger.info(f"Starting job execution", extra={"status": "started"})
    
    try:
        job_func(run_id=run_id)
    except TypeError:
        # If the function hasn't been updated to accept run_id yet
        job_func()

def job_listener(event: JobExecutionEvent):
    """Listens to APScheduler events for duration and failure tracking."""
    job_id = event.job_id
    
    # Ignore internal scheduler jobs if needed
    if job_id == "heartbeat_job":
        return
        
    state = get_job_state(job_id)
    
    start_time = state.get("last_start_time")
    duration_ms = int((time.time() - start_time) * 1000) if start_time else 0
    duration_s = duration_ms / 1000.0
    
    # Record duration metric
    job_duration_seconds.labels(job_name=job_id).observe(duration_s)
    
    logger = get_logger("scheduler", job_id)
    
    if event.exception:
        state["consecutive_failures"] += 1
        failures = state["consecutive_failures"]
        
        # Increment metrics
        job_failure_total.labels(job_name=job_id).inc()
        consecutive_failures_gauge.labels(job_name=job_id).set(failures)
        
        error_msg = str(event.exception)
        
        logger.error("Job execution failed", extra={
            "duration_ms": duration_ms,
            "status": "error",
            "error_type": type(event.exception).__name__,
            "last_error": error_msg,
            "retry_count": failures
        })
        
        if failures >= ALERT_FAILURE_THRESHOLD:
            logger.alert(
                alert_type="consecutive_failures",
                message=f"Job {job_id} failed {failures} times consecutively.",
                job_name=job_id,
                consecutive_failures=failures,
                last_error=error_msg,
                duration_ms=duration_ms
            )
    else:
        # Success resets failure count
        state["consecutive_failures"] = 0
        
        # Update metrics
        job_success_total.labels(job_name=job_id).inc()
        consecutive_failures_gauge.labels(job_name=job_id).set(0)
        
        logger.info("Job execution completed", extra={
            "duration_ms": duration_ms,
            "status": "success",
            "retry_count": 0
        })
        
        if duration_ms > ALERT_DURATION_THRESHOLD_MS:
            # If duration is > 2x threshold, it's CRITICAL, else WARNING
            severity = "CRITICAL" if duration_ms > (ALERT_DURATION_THRESHOLD_MS * 2) else "WARNING"
            
            if severity == "CRITICAL":
                logger.alert(
                    alert_type="duration_exceeded",
                    message=f"Job {job_id} exceeded duration threshold significantly.",
                    job_name=job_id,
                    duration_ms=duration_ms,
                    threshold_ms=ALERT_DURATION_THRESHOLD_MS
                )
            else:
                logger.warning(f"Job {job_id} exceeded duration threshold.", extra={
                    "alert": True,
                    "alert_type": "duration_exceeded",
                    "job_name": job_id,
                    "duration_ms": duration_ms,
                    "threshold_ms": ALERT_DURATION_THRESHOLD_MS
                })

def setup_scheduler():
    scheduler = BlockingScheduler()
    
    # 0. Heartbeat every 5 minutes
    scheduler.add_job(
        heartbeat,
        trigger=IntervalTrigger(minutes=5),
        id='heartbeat_job',
        name='Scheduler Alive Heartbeat',
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )
    
    # 1. Scrape News every hour
    scheduler.add_job(
        run_with_observability,
        args=[scrape_news, 'Scrape Anime News Network', 'scrape_news_job'],
        trigger=IntervalTrigger(hours=1),
        id='scrape_news_job',
        name='Scrape Anime News Network',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600
    )
    
    # 2. Scrape Release Schedules every 12 hours
    scheduler.add_job(
        run_with_observability,
        args=[scrape_schedules, 'Scrape Media Release Schedules', 'scrape_schedules_job'],
        trigger=IntervalTrigger(hours=12),
        id='scrape_schedules_job',
        name='Scrape Media Release Schedules',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600
    )
    
    # 3. Scrape Streaming Availability daily
    scheduler.add_job(
        run_with_observability,
        args=[scrape_availability, 'Scrape Playwright Streaming Availability', 'scrape_availability_job'],
        trigger=IntervalTrigger(days=1),
        id='scrape_availability_job',
        name='Scrape Playwright Streaming Availability',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600
    )
    
    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    
    return scheduler

def start_scheduler():
    logger = get_logger("scheduler")
    logger.info("Starting MovieMinds Automated Data Pipeline")
    
    # Start Prometheus metrics server
    try:
        start_http_server(8003)
        logger.info("Prometheus metrics server started on port 8003")
    except Exception as e:
        logger.error(f"Failed to start Prometheus metrics server: {e}")
    
    scheduler = setup_scheduler()
    
    # Run once immediately on startup
    try:
        logger.info("Running initial boot sequence...")
        heartbeat()
        run_with_observability(scrape_news, 'Scrape Anime News Network', 'scrape_news_job')
        run_with_observability(scrape_schedules, 'Scrape Media Release Schedules', 'scrape_schedules_job')
        run_with_observability(scrape_availability, 'Scrape Playwright Streaming Availability', 'scrape_availability_job')
    except Exception as e:
        logger.error(f"Initial boot error: {e}", extra={"error_type": type(e).__name__, "last_error": str(e)})
        
    logger.info("All jobs scheduled successfully. Listening for events...")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down gracefully...")

if __name__ == "__main__":
    start_scheduler()
