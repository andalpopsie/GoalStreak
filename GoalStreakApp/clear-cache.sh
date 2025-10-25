#!/bin/bash

echo "🧹 Clearing all caches..."

# Clear Expo cache
rm -rf .expo
echo "✅ Cleared .expo cache"

# Clear Metro bundler cache
rm -rf node_modules/.cache
echo "✅ Cleared Metro cache"

# Clear watchman (if installed)
watchman watch-del-all 2>/dev/null && echo "✅ Cleared watchman" || echo "⚠️  Watchman not installed (optional)"

# Clear iOS build (if exists)
if [ -d "ios/build" ]; then
  rm -rf ios/build
  echo "✅ Cleared iOS build"
fi

# Clear temp files
rm -rf /tmp/metro-* 2>/dev/null
rm -rf /tmp/haste-map-* 2>/dev/null
echo "✅ Cleared temp files"

echo ""
echo "🎉 All caches cleared!"
echo ""
echo "Now run: npx expo start --clear"
