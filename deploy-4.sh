#!/bin/bash
set -e

# --- CONFIGURATION ---
SERVICE_NAME="ghl-moose-adk-mcp-agent-v1"
REGION="us-east1"
PROJECT_ID="ninth-potion-455712-g9"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# GHL KEYS
GHL_API_KEY="pit-*******-ad48369536f4"
GHL_LOCATION_ID="4rKuULH**********1XH"

echo "🚀 Deploying: $SERVICE_NAME"
echo "   Image: $IMAGE_NAME"
echo "--------------------------------------------------"

# STEP 1: Build and push to Google Container Registry (NOT Artifact Registry)
echo "📦 Building image with Cloud Build..."
gcloud builds submit --tag "$IMAGE_NAME" .

# STEP 2: Deploy the image to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GHL_API_KEY="$GHL_API_KEY",GHL_LOCATION_ID="$GHL_LOCATION_ID",GOOGLE_CLOUD_LOCATION="global" \
  --min-instances=1 \
  --timeout=600 \
  --cpu=2 \
  --memory=2Gi

echo "--------------------------------------------------"
echo "✅ Done! User: admin | Pass: stark"