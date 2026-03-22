#!/bin/bash
set -e

echo "🚀 Starting Xtrix Backend..."
echo "📂 Current directory: $(pwd)"
echo "📋 Contents: $(ls -la)"

# Check if we're in root with backend/ folder
if [ -d "backend" ]; then
    echo "✅ Found backend/ folder, navigating..."
    cd backend
else
    echo "⚠️  Already in backend directory or backend/ not found"
fi

echo "📂 Backend directory: $(pwd)"
echo "📋 Backend contents: $(ls -la)"

echo "📦 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

echo "🔥 Starting FastAPI server on port ${PORT:-8001}..."
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001} --log-level info

