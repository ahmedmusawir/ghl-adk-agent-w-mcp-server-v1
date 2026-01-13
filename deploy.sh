#!/bin/bash
set -e

# --- CONFIGURATION ---
SERVICE_NAME="ghl-moose-adk-mcp-agent-v1"
REGION="us-east1"
PROJECT_ID="ninth-potion-455712-g9"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying: $SERVICE_NAME (SECURE MODE)"
echo "--------------------------------------------------"

# STEP 1: Build (Uncomment if you need to rebuild code changes)
# echo "📦 Building image..."
# gcloud builds submit --tag "$IMAGE_NAME" .

# STEP 2: Deploy with Secrets & No Throttling
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account="stark-vertex-ai@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-secrets="GHL_API_KEY=ghl-api-key:latest,GHL_LOCATION_ID=ghl-location-id:latest" \
  --set-env-vars="GOOGLE_CLOUD_LOCATION=global,GOOGLE_GENAI_USE_VERTEXAI=TRUE" \
  --min-instances=1 \
  --timeout=600 \
  --cpu=2 \
  --memory=2Gi \
  --no-cpu-throttling \
  --cpu-boost

echo "--------------------------------------------------"
echo "✅ Deployment complete!"
echo "📡 Service URL (Should be unchanged):"
gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)"