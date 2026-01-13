#!/bin/bash

echo "🏗️  Building the Hybrid Container..."
docker build -t ghl-hybrid .

echo "🚀 Starting the Engine..."
echo "   - ADK UI: http://localhost:8000"
echo "   - MCP Server: Internal Port 9000"

# Run the container
# --rm: Automatically remove the container when you stop it
# -p 8080:8000: Connect your laptop port 8080 to container port 8000
# -e: Inject the GHL keys
docker run --rm \
  -p 8080:8080 \
  -e GHL_API_KEY="pit-378c1da7-4453-45eb-a3be-ad48369536f4" \
  -e GHL_LOCATION_ID="4rKuULHASyQ99nwdL1XH" \
  --name ghl-test-runner \
  ghl-hybrid