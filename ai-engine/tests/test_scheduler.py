import pytest
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.scheduler import setup_scheduler

def test_scheduler_job_registration():
    """Tests that the scheduler correctly registers all expected jobs."""
    scheduler = setup_scheduler()
    jobs = scheduler.get_jobs()
    
    # We expect 3 jobs
    assert len(jobs) == 3
    
    job_ids = [job.id for job in jobs]
    assert 'scrape_news_job' in job_ids
    assert 'scrape_schedules_job' in job_ids
    assert 'scrape_availability_job' in job_ids

def test_scheduler_overlap_configuration():
    """Tests that jobs are configured to prevent overlapping execution (max_instances=1)."""
    scheduler = setup_scheduler()
    for job in scheduler.get_jobs():
        # APScheduler default is usually 1, but we explicitly enforce it to prevent duplicate writes
        assert job.max_instances == 1
        assert job.coalesce is True
        assert job.misfire_grace_time == 3600

def test_scheduler_manual_execution():
    """Tests that we can trigger the jobs manually via the scheduler."""
    scheduler = setup_scheduler()
    job = scheduler.get_job('scrape_news_job')
    assert job is not None
    # We won't actually call job.func() here because that hits the real functions,
    # but we verify the function is resolvable.
    assert callable(job.func)
