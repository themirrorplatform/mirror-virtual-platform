# Dockerfile for Render.com / Alternative Platforms
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render uses PORT env var)
EXPOSE ${PORT:-8100}

# Run the application (Render provides $PORT)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8100}
