import logging
import sys
from pythonjsonlogger import jsonlogger

def get_logger(component: str, job_name: str = None, run_id: str = None):
    """
    Returns a configured JSON logger for structured observability.
    
    Fields automatically included:
    - timestamp
    - level
    - service: 'ai-engine'
    - component: (e.g. 'scheduler', 'news_spider')
    - job_name: (e.g. 'scrape_news')
    - run_id: Execution UUID
    """
    logger = logging.getLogger(f"movieminds.{component}")
    
    # Avoid attaching multiple handlers if get_logger is called repeatedly
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        handler = logging.StreamHandler(sys.stdout)
        
        # Configure standard JSON format
        # Fields like asctime and levelname will map to timestamp and level
        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(levelname)s %(message)s',
            rename_fields={"asctime": "timestamp", "levelname": "level"}
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    # We wrap the logger in a LoggerAdapter to easily inject our required static context fields
    extra = {
        "service": "ai-engine",
        "component": component
    }
    
    if job_name:
        extra["job_name"] = job_name
    if run_id:
        extra["run_id"] = run_id
        
    return CustomLoggerAdapter(logger, extra)

class CustomLoggerAdapter(logging.LoggerAdapter):
    """Adapter to inject standard context and handle alerts."""
    
    def process(self, msg, kwargs):
        # Merge adapter extra fields into the log record's 'extra' dict
        extra = self.extra.copy()
        
        if 'extra' in kwargs:
            extra.update(kwargs['extra'])
            
        kwargs['extra'] = extra
        return msg, kwargs
        
    def alert(self, alert_type: str, message: str, **context):
        """
        Emits a CRITICAL structured alert event.
        """
        context['alert'] = True
        context['alert_type'] = alert_type
        
        # Ensure last_error is bubbled up explicitly if passed in context or as exception
        if 'last_error' not in context and 'error_type' in context:
            context['last_error'] = context.get('error_type')
            
        self.critical(message, extra=context)
