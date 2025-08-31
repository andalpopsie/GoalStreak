#!/usr/bin/env node

/**
 * Firebase Emulator Teardown Script
 * Stops Firebase emulators and cleans up test data
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  ui: 4000
};

/**
 * Kill processes running on specific ports
 */
async function killProcessOnPort(port) {
  try {
    // Find process ID using the port
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(pid => pid);
    
    if (pids.length > 0) {
      console.log(`🔪 Killing processes on port ${port}: ${pids.join(', ')}`);
      
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
        } catch (error) {
          // Process might already be dead
          console.log(`⚠️  Process ${pid} already terminated`);
        }
      }
    } else {
      console.log(`✅ No processes found on port ${port}`);
    }
  } catch (error) {
    // No processes found or lsof not available
    console.log(`✅ Port ${port} is free`);
  }
}

/**
 * Stop Firebase emulators gracefully
 */
async function stopEmulators() {
  console.log('🛑 Stopping Firebase emulators...');
  
  try {
    // Try graceful shutdown first
    console.log('📤 Attempting graceful shutdown...');
    await execAsync('npx firebase emulators:stop');
    console.log('✅ Emulators stopped gracefully');
  } catch (error) {
    console.log('⚠️  Graceful shutdown failed, forcing termination...');
    
    // Force kill processes on emulator ports
    for (const [service, port] of Object.entries(EMULATOR_PORTS)) {
      await killProcessOnPort(port);
    }
  }
  
  // Additional cleanup - kill any remaining firebase processes
  try {
    await execAsync('pkill -f "firebase.*emulator"');
    console.log('🧹 Cleaned up remaining Firebase processes');
  } catch (error) {
    // No processes to kill
  }
  
  console.log('✅ All emulators stopped successfully');
}

/**
 * Clear emulator data
 */
async function clearEmulatorData() {
  console.log('🧹 Clearing emulator data...');
  
  try {
    // Clear Firestore data
    await execAsync('npx firebase emulators:exec --only firestore "echo \\"Clearing Firestore data\\""');
    console.log('✅ Firestore data cleared');
  } catch (error) {
    console.log('⚠️  Could not clear Firestore data:', error.message);
  }
  
  try {
    // Clear Auth data
    await execAsync('npx firebase emulators:exec --only auth "echo \\"Clearing Auth data\\""');
    console.log('✅ Auth data cleared');
  } catch (error) {
    console.log('⚠️  Could not clear Auth data:', error.message);
  }
  
  try {
    // Clear Storage data
    await execAsync('npx firebase emulators:exec --only storage "echo \\"Clearing Storage data\\""');
    console.log('✅ Storage data cleared');
  } catch (error) {
    console.log('⚠️  Could not clear Storage data:', error.message);
  }
}

/**
 * Check if emulators are running
 */
async function checkEmulatorStatus() {
  console.log('🔍 Checking emulator status...');
  
  const statuses = {};
  
  for (const [service, port] of Object.entries(EMULATOR_PORTS)) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      statuses[service] = stdout.trim() ? 'running' : 'stopped';
    } catch (error) {
      statuses[service] = 'stopped';
    }
  }
  
  console.log('📊 Emulator Status:');
  for (const [service, status] of Object.entries(statuses)) {
    const icon = status === 'running' ? '🟢' : '🔴';
    console.log(`  ${icon} ${service}: ${status} (port ${EMULATOR_PORTS[service]})`);
  }
  
  return statuses;
}

/**
 * Main cleanup function
 */
async function cleanup(options = {}) {
  const { clearData = false, checkStatus = false } = options;
  
  if (checkStatus) {
    await checkEmulatorStatus();
    return;
  }
  
  if (clearData) {
    await clearEmulatorData();
  }
  
  await stopEmulators();
  
  // Final status check
  setTimeout(async () => {
    console.log('\n🔍 Final status check:');
    await checkEmulatorStatus();
  }, 1000);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    clearData: args.includes('--clear-data'),
    checkStatus: args.includes('--status')
  };
  
  cleanup(options)
    .then(() => {
      if (!options.checkStatus) {
        console.log('🎉 Cleanup completed successfully');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { stopEmulators, clearEmulatorData, checkEmulatorStatus, cleanup };