#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- CONFIGURATION ---
SERVICE_NAME="ghl-mcp-agent-v1"
REGION="us-east1"
PROJECT_ID="ninth-potion-455712-g9"

# GHL KEYS (Injected securely into the cloud)
GHL_API_KEY="pit-*******-ad48369536f4"
GHL_LOCATION_ID="4rKuU******99nwdL1XH"

echo "🚀 Beginning deployment for service: $SERVICE_NAME"
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Security: PUBLIC URL (Protected by Nginx Basic Auth)"
echo "--------------------------------------------------"

# STEP 1: Ensure the default Cloud Run repo exists
echo "📦 Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" \
  --description="Auto-generated for Cloud Run source deployments" \
  2>/dev/null || echo "   Repository already exists (OK)"

# STEP 2: Deploy with explicit project and no cached configs
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars GHL_API_KEY="$GHL_API_KEY",GHL_LOCATION_ID="$GHL_LOCATION_ID",GOOGLE_CLOUD_LOCATION="global"

echo "--------------------------------------------------"
echo "✅ Deployment Complete!"
echo "   1. Click the URL above."
echo "   2. Enter User: admin"
echo "   3. Enter Pass: stark"