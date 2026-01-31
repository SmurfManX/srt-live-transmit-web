# Multi-stage build for optimized production image
FROM python:3.12-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libsrt-dev \
    srt-tools \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.12-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libsrt1.5 \
    srt-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r srtmanager && useradd -r -g srtmanager srtmanager

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/srtmanager/.local

# Copy application code
COPY --chown=srtmanager:srtmanager . .

# Create directories for data
RUN mkdir -p /app/data /app/logs /app/stats && \
    chown -R srtmanager:srtmanager /app

# Switch to non-root user
USER srtmanager

# Set environment variables
ENV PATH=/home/srtmanager/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///data/channels.db
ENV JWT_SECRET_KEY=change-me-in-production
ENV LOG_LEVEL=INFO

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "main.py"]
