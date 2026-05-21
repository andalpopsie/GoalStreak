const { withDangerousMod, withInfoPlist } = require("expo/config-plugins");
const { resolve, join } = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Config plugin that generates all required iOS app icon sizes
 * from the 1024x1024 source icon to satisfy Apple's validation.
 */
function withFullAppIcons(config) {
  // First, ensure CFBundleIconName is set in Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleIconName = "AppIcon";
    return config;
  });

  // Then generate all icon sizes
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;

      // Find the .xcassets directory
      const appName = config.modRequest.projectName || "GoalStreak";
      const xcassetsPath = join(
        platformRoot,
        appName,
        "Images.xcassets",
        "AppIcon.appiconset"
      );

      // Source icon (1024x1024)
      const sourceIcon = resolve(projectRoot, "assets", "icon.png");

      if (!fs.existsSync(sourceIcon)) {
        console.warn("[withFullAppIcons] No icon.png found in assets/");
        return config;
      }

      if (!fs.existsSync(xcassetsPath)) {
        fs.mkdirSync(xcassetsPath, { recursive: true });
      }

      // Define all required icon sizes
      const icons = [
        { name: "Icon-20@2x.png", size: 40 },
        { name: "Icon-20@3x.png", size: 60 },
        { name: "Icon-29@2x.png", size: 58 },
        { name: "Icon-29@3x.png", size: 87 },
        { name: "Icon-40@2x.png", size: 80 },
        { name: "Icon-40@3x.png", size: 120 },
        { name: "Icon-60@2x.png", size: 120 },
        { name: "Icon-60@3x.png", size: 180 },
        { name: "Icon-76@2x.png", size: 152 },
        { name: "Icon-83.5@2x.png", size: 167 },
        { name: "App-Icon-1024x1024@1x.png", size: 1024 },
      ];

      // Generate each icon size using sips (macOS) or sharp if available
      for (const icon of icons) {
        const outputPath = join(xcassetsPath, icon.name);
        try {
          // Copy source first
          fs.copyFileSync(sourceIcon, outputPath);
          // Resize using sips (available on macOS EAS build machines)
          execSync(
            `sips -z ${icon.size} ${icon.size} "${outputPath}" --out "${outputPath}"`,
            { stdio: "pipe" }
          );
        } catch (e) {
          console.warn(
            `[withFullAppIcons] Failed to generate ${icon.name}: ${e.message}`
          );
        }
      }

      // Write the Contents.json with all icon entries
      const contentsJson = {
        images: [
          {
            filename: "Icon-20@2x.png",
            idiom: "iphone",
            scale: "2x",
            size: "20x20",
          },
          {
            filename: "Icon-20@3x.png",
            idiom: "iphone",
            scale: "3x",
            size: "20x20",
          },
          {
            filename: "Icon-29@2x.png",
            idiom: "iphone",
            scale: "2x",
            size: "29x29",
          },
          {
            filename: "Icon-29@3x.png",
            idiom: "iphone",
            scale: "3x",
            size: "29x29",
          },
          {
            filename: "Icon-40@2x.png",
            idiom: "iphone",
            scale: "2x",
            size: "40x40",
          },
          {
            filename: "Icon-40@3x.png",
            idiom: "iphone",
            scale: "3x",
            size: "40x40",
          },
          {
            filename: "Icon-60@2x.png",
            idiom: "iphone",
            scale: "2x",
            size: "60x60",
          },
          {
            filename: "Icon-60@3x.png",
            idiom: "iphone",
            scale: "3x",
            size: "60x60",
          },
          {
            filename: "Icon-20@2x.png",
            idiom: "ipad",
            scale: "2x",
            size: "20x20",
          },
          {
            filename: "Icon-29@2x.png",
            idiom: "ipad",
            scale: "2x",
            size: "29x29",
          },
          {
            filename: "Icon-40@2x.png",
            idiom: "ipad",
            scale: "2x",
            size: "40x40",
          },
          {
            filename: "Icon-76@2x.png",
            idiom: "ipad",
            scale: "2x",
            size: "76x76",
          },
          {
            filename: "Icon-83.5@2x.png",
            idiom: "ipad",
            scale: "2x",
            size: "83.5x83.5",
          },
          {
            filename: "App-Icon-1024x1024@1x.png",
            idiom: "ios-marketing",
            scale: "1x",
            size: "1024x1024",
          },
        ],
        info: {
          version: 1,
          author: "expo",
        },
      };

      fs.writeFileSync(
        join(xcassetsPath, "Contents.json"),
        JSON.stringify(contentsJson, null, 2)
      );

      console.log(
        "[withFullAppIcons] Generated all required iOS app icon sizes"
      );

      return config;
    },
  ]);
}

module.exports = withFullAppIcons;
