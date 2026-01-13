#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

SERVICE_NAME="greeting-agent-service"

echo "🚀 Beginning deployment for service: $SERVICE_NAME"
echo "   Using gcloud run deploy for full control..."
echo "--------------------------------------------------"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --allow-unauthenticated \

echo "--------------------------------------------------"
echo "✅ If there are no errors above, the deployment is complete!"