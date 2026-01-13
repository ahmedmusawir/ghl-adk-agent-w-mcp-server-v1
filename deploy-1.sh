#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- CONFIGURATION ---
SERVICE_NAME="ghl-mcp-agent-v1"
REGION="us-east1"

# GHL KEYS (Injected securely into the cloud)
GHL_API_KEY="pit-378c1da7-4453-*****-ad48369536f4"
GHL_LOCATION_ID="4rK****99nwdL1XH"

echo "🚀 Beginning deployment for service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Security: PUBLIC URL (Protected by Nginx Basic Auth)"
echo "--------------------------------------------------"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars GHL_API_KEY="$GHL_API_KEY",GHL_LOCATION_ID="$GHL_LOCATION_ID",GOOGLE_CLOUD_LOCATION="global" \
  --platform managed

echo "--------------------------------------------------"
echo "✅ Deployment Complete!"
echo "   1. Click the URL above."
echo "   2. Enter User: admin"
echo "   3. Enter Pass: stark"