FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Railway provides $PORT)
EXPOSE 8001

# Start with shell to expand PORT variable
CMD sh -c "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"

