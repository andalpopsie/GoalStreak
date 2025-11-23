#!/bin/bash

# Generate iOS App Icons from source icon.png
# Source: 500x500 icon.png
# Output: All required iOS icon sizes

SOURCE="icon.png"
OUTPUT_DIR="."

echo "🎨 Generating iOS App Icons from $SOURCE..."

# Check if source exists
if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: $SOURCE not found!"
    exit 1
fi

# Check if sips is available (macOS built-in tool)
if ! command -v sips &> /dev/null; then
    echo "❌ Error: sips command not found. This script requires macOS."
    exit 1
fi

# Generate all required sizes
echo "📱 Generating App Store icon (1024x1024)..."
sips -z 1024 1024 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-AppStore.png"

echo "📱 Generating iPhone @3x icon (180x180)..."
sips -z 180 180 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-60@3x.png"

echo "📱 Generating iPhone @2x icon (120x120)..."
sips -z 120 120 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-60@2x.png"

echo "📱 Generating iPad Pro icon (167x167)..."
sips -z 167 167 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-83.5@2x.png"

echo "📱 Generating iPad @2x icon (152x152)..."
sips -z 152 152 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-76@2x.png"

echo "📱 Generating iPad @1x icon (76x76)..."
sips -z 76 76 "$SOURCE" --out "${OUTPUT_DIR}/AppIcon-76.png"

echo ""
echo "✅ All iOS icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh AppIcon-*.png
echo ""
echo "🎉 Ready for App Store submission!"
