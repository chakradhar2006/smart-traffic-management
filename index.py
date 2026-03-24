import sys
import os

# Add the project root to sys.path so we can import from 'backend'
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

# Import the FastAPI app
try:
    from backend.main import app
except ImportError as e:
    print(f"Error importing app: {e}")
    # Fallback to a simple app if import fails for debugging
    from fastapi import FastAPI
    app = FastAPI()
    @app.get("/")
    def read_root():
        return {"error": f"Import failed: {str(e)}", "path": sys.path}
