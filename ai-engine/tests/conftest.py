import os
import sys
import uuid
import pytest
from playwright.async_api import async_playwright

# Set TESTING env before any other imports so db.py knows to load .env.test
os.environ['TESTING'] = '1'

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.db import get_db_connection

@pytest.fixture(scope="session", autouse=True)
def verify_test_schema():
    """Hard safety check to ensure we are operating in test_schema."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # We explicitly set it for the connection because PgBouncer might not persist the URL schema arg
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("SHOW search_path;")
            result = cursor.fetchone()
            search_path = result['search_path']
            
            if 'test_schema' not in search_path:
                pytest.exit(f"CRITICAL SAFETY FAILURE: search_path is '{search_path}'. Expected 'test_schema'. Aborting tests!")
            print(f"\n✅ Pytest search_path verified: {search_path}")
    finally:
        conn.close()

@pytest.fixture(scope="session")
def test_run_id():
    """Generates a unique identifier for this test run."""
    return f"pytest_{uuid.uuid4().hex[:8]}"

@pytest.fixture(scope="function")
def db_cleanup(test_run_id):
    """Fixture to clean up specific test records after each test."""
    yield test_run_id
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET search_path TO test_schema;")
            cursor.execute("DELETE FROM news_articles WHERE title LIKE %s", (f"%{test_run_id}%",))
            cursor.execute("DELETE FROM streaming_platforms WHERE name LIKE %s", (f"%{test_run_id}%",))
            # Clean up mock media items created during schedule testing
            cursor.execute("DELETE FROM media WHERE title LIKE %s", (f"%{test_run_id}%",))
    finally:
        conn.close()

# For Playwright artifact retention
@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {
        **browser_context_args,
        "record_video_dir": "artifacts/videos/",
        "record_har_path": "artifacts/network.har"
    }

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Saves screenshots on failure."""
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        # Check if the test requested a 'page' fixture (Playwright)
        if "page" in item.funcargs:
            page = item.funcargs["page"]
            artifact_dir = os.path.join(os.path.dirname(__file__), "artifacts")
            os.makedirs(artifact_dir, exist_ok=True)
            screenshot_path = os.path.join(artifact_dir, f"{item.name}.png")
            # This is synchronous context inside pytest, so we have to use page.screenshot synchronously if available,
            # but pytest-playwright's async page fixture handles it via asyncio. We rely on pytest-playwright's
            # built-in `--tracing retain-on-failure` CLI flag instead of manual capture here to avoid async/sync deadlocks.
            pass
