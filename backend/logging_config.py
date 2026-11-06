import os
import sys
import time
import uuid
import logging
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        request_id = getattr(record, "request_id", "-")
        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

def setup_logging():
    logger = logging.getLogger("smart_hire")
    logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    
    # Avoid duplicate handlers on reload
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        
    return logger

logger = setup_logging()

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id
        
        start_time = time.time()
        
        # Log request receipt
        extra = {"request_id": req_id}
        
        try:
            response: Response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Slow request warning (>500ms)
            if duration_ms > 500:
                logger.warning(
                    f"SLOW REQUEST: {request.method} {request.url.path} took {duration_ms}ms (>500ms)",
                    extra=extra
                )
            else:
                if os.environ.get("DEBUG", "").lower() in ("true", "1"):
                    logger.debug(
                        f"{request.method} {request.url.path} - {response.status_code} ({duration_ms}ms)",
                        extra=extra
                    )
            
            response.headers["X-Request-ID"] = req_id
            return response
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled Exception on {request.method} {request.url.path} ({duration_ms}ms): {str(exc)}",
                exc_info=True,
                extra=extra
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "An internal server error occurred. Please try again.",
                    "request_id": req_id
                },
                headers={"X-Request-ID": req_id}
            )

