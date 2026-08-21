import pytest
from unittest.mock import patch
import sys
import os
import json

# Add parent directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.scheduler import run_with_observability, get_job_state, ALERT_FAILURE_THRESHOLD
from scraper.logger import CustomLoggerAdapter

def failing_job(run_id=None):
    raise ValueError("Intentional crash for observability testing")

def successful_job(run_id=None):
    return True

@patch.object(CustomLoggerAdapter, 'alert')
@patch.object(CustomLoggerAdapter, 'error')
def test_observability_consecutive_failures(mock_error, mock_alert):
    """
    Tests that the scheduler's observability wrapper triggers an alert
    after reaching the configured ALERT_FAILURE_THRESHOLD.
    """
    # Note: run_with_observability wraps jobs but we need the APScheduler event listener 
    # to actually trigger the error tracking. Since we are unit testing, 
    # let's just trigger the event listener manually or test the listener directly.
    from scraper.scheduler import job_listener
    from apscheduler.events import JobExecutionEvent
    from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
    
    job_id = 'test_job_123'
    state = get_job_state(job_id)
    state["consecutive_failures"] = 0 # reset
    state["last_start_time"] = 0
    
    # 1. Simulate failures up to threshold - 1
    for i in range(ALERT_FAILURE_THRESHOLD - 1):
        event = JobExecutionEvent(EVENT_JOB_ERROR, job_id, "test_job_id", "test_job_123")
        event.exception = ValueError("Simulated Exception")
        job_listener(event)
        
    assert state["consecutive_failures"] == ALERT_FAILURE_THRESHOLD - 1
    mock_alert.assert_not_called() # Should not have alerted yet
    
    # 2. Simulate the threshold failure
    event = JobExecutionEvent(EVENT_JOB_ERROR, job_id, "test_job_id", "test_job_123")
    event.exception = ValueError("Simulated Exception")
    job_listener(event)
    
    assert state["consecutive_failures"] == ALERT_FAILURE_THRESHOLD
    assert mock_alert.call_count == 1
    
    # Verify alert payload structure
    args, kwargs = mock_alert.call_args
    assert kwargs['alert_type'] == "consecutive_failures"
    assert kwargs['job_name'] == job_id
    assert kwargs['consecutive_failures'] == ALERT_FAILURE_THRESHOLD
    
    # 3. Simulate a success to verify it resets
    event = JobExecutionEvent(EVENT_JOB_EXECUTED, job_id, "test_job_id", "test_job_123")
    event.exception = None
    job_listener(event)
    
    assert state["consecutive_failures"] == 0

def test_json_log_formatting(capsys):
    """Verifies that logs are emitted as structured JSON."""
    from scraper.logger import get_logger
    logger = get_logger("test_component", "test_job", "run-1234")
    logger.info("Test log message", extra={"custom_field": 42})
    
    # Read stdout
    captured = capsys.readouterr()
    log_output = captured.out.strip()
    
    # Some older logger handlers might still be attached during test suite execution,
    # so we'll grab the last line which is from our JSONLogger
    last_line = log_output.split('\n')[-1]
    
    try:
        parsed = json.loads(last_line)
        assert parsed["message"] == "Test log message"
        assert parsed["service"] == "ai-engine"
        assert parsed["component"] == "test_component"
        assert parsed["job_name"] == "test_job"
        assert parsed["run_id"] == "run-1234"
        assert parsed["custom_field"] == 42
        assert "timestamp" in parsed
        assert parsed["level"] == "INFO"
    except json.JSONDecodeError:
        pytest.fail(f"Log output was not valid JSON: {last_line}")
