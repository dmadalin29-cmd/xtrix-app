FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Expose port (Railway sets $PORT dynamically)
EXPOSE 8001

# Start with shell form to expand $PORT variable
CMD sh -c "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"

