import sys
import os

# Add /app or ./app to sys.path so modules resolve smoothly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
