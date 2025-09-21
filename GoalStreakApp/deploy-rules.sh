#!/bin/bash

# Deploy Firestore security rules
echo "🔥 Deploying Firestore security rules..."
npx firebase-tools deploy --only firestore:rules

# Deploy Storage rules (if storage is enabled)
echo "📦 Deploying Storage security rules..."
npx firebase-tools deploy --only storage 2>/dev/null || echo "⚠️  Storage not enabled - skipping storage rules"

echo "✅ Security rules deployment complete!"
