# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (if any)
# RUN apt-get update && apt-get install -y ...

# Copy requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose port 8001
EXPOSE 8001

# Command to run the application
# Note: In production, use gunicorn or similar. Here using uvicorn directly or via python script.
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
