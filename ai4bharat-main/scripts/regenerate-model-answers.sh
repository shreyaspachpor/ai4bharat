#!/bin/bash

# Script to regenerate model answers for all interviews
# Run this from the project root: bash scripts/regenerate-model-answers.sh

# Generate a secret token (you can replace this with your actual token)
TOKEN="your-secret-admin-token"

echo "🔄 Starting to regenerate model answers for all interviews..."
echo ""

# Call the API endpoint
curl -X POST http://localhost:3000/api/admin/regenerate-model-answers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "✅ Update process completed!"
