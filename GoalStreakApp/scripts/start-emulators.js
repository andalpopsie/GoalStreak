#!/usr/bin/env node

/**
 * Firebase Emulator Startup Script
 * Starts Firebase emulators for integration testing
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  ui: 4000
};

const TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

/**
 * Wait for emulator to be ready
 */
async function waitForEmulator(port, maxAttempts = 30) {
  const http = require('http');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          resolve(res);
        });
        
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

/**
 * Start Firebase emulators
 */
async function startEmulators() {
  console.log('🚀 Starting Firebase emulators...');
  
  // Check if ports are available
  for (const [service, port] of Object.entries(EMULATOR_PORTS)) {
    const available = await isPortAvailable(port);
    if (!available) {
      console.log(`⚠️  Port ${port} (${service}) is already in use. Emulators may already be running.`);
    }
  }
  
  // Start emulators
  const emulatorProcess = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,storage'], {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  let isReady = false;
  
  // Monitor emulator output
  emulatorProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    if (output.includes('All emulators ready')) {
      isReady = true;
    }
  });
  
  emulatorProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('Emulator error:', error);
  });
  
  // Wait for emulators to be ready
  const startTime = Date.now();
  while (!isReady && (Date.now() - startTime) < TIMEOUT_MS) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!isReady) {
    console.error('❌ Emulators failed to start within timeout');
    emulatorProcess.kill();
    process.exit(1);
  }
  
  // Verify emulators are responding
  console.log('🔍 Verifying emulator connectivity...');
  
  const authReady = await waitForEmulator(EMULATOR_PORTS.auth);
  const firestoreReady = await waitForEmulator(EMULATOR_PORTS.firestore);
  const storageReady = await waitForEmulator(EMULATOR_PORTS.storage);
  
  if (authReady && firestoreReady && storageReady) {
    console.log('✅ All emulators are ready and responding!');
    console.log(`📊 Emulator UI: http://localhost:${EMULATOR_PORTS.ui}`);
    console.log(`🔐 Auth Emulator: http://localhost:${EMULATOR_PORTS.auth}`);
    console.log(`🗄️  Firestore Emulator: http://localhost:${EMULATOR_PORTS.firestore}`);
    console.log(`📁 Storage Emulator: http://localhost:${EMULATOR_PORTS.storage}`);
  } else {
    console.error('❌ Some emulators are not responding');
    emulatorProcess.kill();
    process.exit(1);
  }
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping emulators...');
    emulatorProcess.kill();
    process.exit(0);
  });
  
  return emulatorProcess;
}

/**
 * Seed test data
 */
async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  try {
    // Import and run seeding function
    const { initializeFirebaseEmulators, createTestUser, seedTestData } = require('../src/__tests__/utils/firebaseEmulator');
    
    const { auth, db } = await initializeFirebaseEmulators();
    
    // Create test users
    const testUser1 = await createTestUser('user1@test.com', 'password123', 'Test User 1');
    const testUser2 = await createTestUser('user2@test.com', 'password123', 'Test User 2');
    
    // Seed data for test users
    await seedTestData(testUser1.uid);
    await seedTestData(testUser2.uid);
    
    console.log('✅ Test data seeded successfully');
    console.log(`👤 Test User 1: ${testUser1.email} (${testUser1.uid})`);
    console.log(`👤 Test User 2: ${testUser2.email} (${testUser2.uid})`);
    
  } catch (error) {
    console.error('❌ Failed to seed test data:', error.message);
  }
}

// Main execution
if (require.main === module) {
  startEmulators()
    .then(() => {
      // Seed test data after emulators are ready
      setTimeout(seedTestData, 2000);
    })
    .catch((error) => {
      console.error('❌ Failed to start emulators:', error);
      process.exit(1);
    });
}

module.exports = { startEmulators, waitForEmulator, isPortAvailable };