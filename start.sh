#!/bin/bash
set -e

echo "🚀 Starting Xtrix Backend..."

# Navigate to backend directory
cd backend

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🔥 Starting FastAPI server..."
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
