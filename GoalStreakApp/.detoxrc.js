module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/GoalStreakApp.app',
      build: 'xcodebuild -workspace ios/GoalStreakApp.xcworkspace -scheme GoalStreakApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/GoalStreakApp.app',
      build: 'xcodebuild -workspace ios/GoalStreakApp.xcworkspace -scheme GoalStreakApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    // iOS Simulators
    'iphone-se': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (3rd generation)'
      }
    },
    'iphone-14': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    'iphone-14-pro-max': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro Max'
      }
    },
    'ipad-air': {
      type: 'ios.simulator',
      device: {
        type: 'iPad Air (5th generation)'
      }
    },
    
    // Android Emulators
    'pixel-3': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3_API_30_x86'
      }
    },
    'pixel-4-xl': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_XL_API_30_x86'
      }
    },
    'nexus-5x': {
      type: 'android.emulator',
      device: {
        avdName: 'Nexus_5X_API_30_x86'
      }
    },
    
    // Physical devices
    'android-attached': {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    
    // Cloud devices (for CI/CD)
    'genymotion-cloud': {
      type: 'android.genycloud',
      device: {
        recipeUUID: 'your-recipe-uuid'
      }
    }
  },
  configurations: {
    // iOS Debug Configurations
    'ios.sim.debug': {
      device: 'iphone-14',
      app: 'ios.debug'
    },
    'ios.se.debug': {
      device: 'iphone-se',
      app: 'ios.debug'
    },
    'ios.max.debug': {
      device: 'iphone-14-pro-max',
      app: 'ios.debug'
    },
    'ios.ipad.debug': {
      device: 'ipad-air',
      app: 'ios.debug'
    },
    
    // iOS Release Configurations
    'ios.sim.release': {
      device: 'iphone-14',
      app: 'ios.release'
    },
    'ios.se.release': {
      device: 'iphone-se',
      app: 'ios.release'
    },
    'ios.max.release': {
      device: 'iphone-14-pro-max',
      app: 'ios.release'
    },
    
    // Android Debug Configurations
    'android.emu.debug': {
      device: 'pixel-3',
      app: 'android.debug'
    },
    'android.xl.debug': {
      device: 'pixel-4-xl',
      app: 'android.debug'
    },
    'android.nexus.debug': {
      device: 'nexus-5x',
      app: 'android.debug'
    },
    'android.att.debug': {
      device: 'android-attached',
      app: 'android.debug'
    },
    
    // Android Release Configurations
    'android.emu.release': {
      device: 'pixel-3',
      app: 'android.release'
    },
    'android.xl.release': {
      device: 'pixel-4-xl',
      app: 'android.release'
    },
    'android.att.release': {
      device: 'android-attached',
      app: 'android.release'
    },
    
    // Cross-platform test configurations
    'cross.debug': {
      device: 'iphone-14',
      app: 'ios.debug'
    },
    'cross.android.debug': {
      device: 'pixel-3',
      app: 'android.debug'
    }
  },
  
  // Global configuration
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false
    },
    cleanup: {
      shutdownDevice: false
    }
  },
  
  // Artifacts configuration for debugging
  artifacts: {
    rootDir: './e2e/artifacts',
    pathBuilder: './e2e/utils/pathBuilder.js',
    plugins: {
      log: 'failing',
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: false,
          testDone: true,
          appNotReady: true
        }
      },
      video: {
        android: 'failing',
        ios: 'failing'
      },
      instruments: {
        location: './e2e/artifacts/instruments'
      }
    }
  },
  
  // Logger configuration
  logger: {
    level: process.env.CI ? 'info' : 'debug',
    overrideConsole: true
  }
};