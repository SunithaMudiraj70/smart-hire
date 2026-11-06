#!/usr/bin/env python3
"""
Environment & Health Verification Script for smart-hire
Checks:
1. Critical .env configuration keys
2. Database connectivity
3. Embedding model accessibility
4. Port status (8000 for API, 3000 for Web)
"""

import os
import sys
import socket
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

load_dotenv()

def print_result(label: str, success: bool, detail: str = ""):
    status = "[PASS]" if success else "[FAIL]"
    detail_str = f" - {detail}" if detail else ""
    print(f"{status} {label}{detail_str}")

def check_env_keys():
    required_keys = ["DATABASE_URL", "JWT_SECRET_KEY"]
    optional_keys = ["RAPID_API_KEY", "LOG_LEVEL", "VECTOR_BACKEND", "SEED_DEMO"]
    
    all_ok = True
    for key in required_keys:
        val = os.environ.get(key)
        if not val:
            print_result(f"Required env key: {key}", False, "Missing or empty")
            all_ok = False
        else:
            masked = val[:6] + "..." if len(val) > 10 else "***"
            print_result(f"Required env key: {key}", True, f"Configured ({masked})")
            
    for key in optional_keys:
        val = os.environ.get(key)
        print_result(f"Optional env key: {key}", True, f"Value: {val or 'Not set'}")
        
    return all_ok

def check_database():
    try:
        from backend.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print_result("Database Connection", True, f"Engine bound to {engine.url.drivername}")
        return True
    except Exception as e:
        print_result("Database Connection", False, str(e))
        return False

def check_embedding_model():
    try:
        # Check if sentence-transformers is imported
        import sentence_transformers
        print_result("Sentence Transformers library", True, f"Version {sentence_transformers.__version__}")
        return True
    except Exception as e:
        print_result("Sentence Transformers library", False, str(e))
        return False

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_ports():
    api_active = is_port_in_use(8000)
    web_active = is_port_in_use(3000)
    print_result("API Port 8000 Status", True, "Active and listening" if api_active else "Port free (ready to start)")
    print_result("Web Port 3000 Status", True, "Active and listening" if web_active else "Port free (ready to start)")

if __name__ == "__main__":
    print("\n--- smart-hire Environment & Health Check ---\n")
    k_ok = check_env_keys()
    d_ok = check_database()
    e_ok = check_embedding_model()
    check_ports()
    
    overall = k_ok and d_ok and e_ok
    print("\n" + ("=" * 50))
    if overall:
        print("smart-hire environment is HEALTHY and ready!\n")
        sys.exit(0)
    else:
        print("Environment check identified issues. See above for details.\n")
        sys.exit(1)
