/**
 * Firebase Storage Security Rules Integration Tests
 * Tests Firebase Storage security rules with emulators
 */

import { 
  initializeTestEnvironment, 
  RulesTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata
} from 'firebase/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Firebase Storage Security Rules Integration Tests', () => {
  let testEnv: RulesTestEnvironment;
  
  // Test user IDs
  const ALICE_UID = 'alice-uid';
  const BOB_UID = 'bob-uid';

  // Test file data
  const createTestImageFile = (size: number = 1024): Uint8Array => {
    return new Uint8Array(size).fill(0xFF); // Simple test image data
  };

  const createLargeFile = (): Uint8Array => {
    return new Uint8Array(6 * 1024 * 1024).fill(0xFF); // 6MB file (exceeds 5MB limit)
  };

  beforeAll(async () => {
    // Read Storage rules
    const rulesPath = join(__dirname, '../../../storage.rules');
    const rules = readFileSync(rulesPath, 'utf8');

    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'storage-security-test',
      storage: {
        rules,
        host: 'localhost',
        port: 9199
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearStorage();
  });

  describe('User Profile Pictures Access Control', () => {
    it('should allow users to upload their own profile pictures', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertSucceeds(
        uploadBytes(profileRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should deny users from uploading to other users profile folders', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(storage, `users/${BOB_UID}/profile/avatar.jpg`);
      
      await assertFails(
        uploadBytes(profileRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should allow anyone to read profile pictures', async () => {
      // First, Alice uploads her profile picture
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const aliceStorage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(aliceStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await uploadBytes(profileRef, imageData, {
        contentType: 'image/jpeg'
      });

      // Then Bob tries to read Alice's profile picture
      const bob = testEnv.authenticatedContext(BOB_UID);
      const bobStorage = bob.storage();
      const bobProfileRef = ref(bobStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertSucceeds(
        getMetadata(bobProfileRef)
      );
    });

    it('should allow unauthenticated users to read profile pictures', async () => {
      // First, Alice uploads her profile picture
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const aliceStorage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(aliceStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await uploadBytes(profileRef, imageData, {
        contentType: 'image/jpeg'
      });

      // Then unauthenticated user tries to read it
      const unauth = testEnv.unauthenticatedContext();
      const unauthStorage = unauth.storage();
      const unauthProfileRef = ref(unauthStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertSucceeds(
        getMetadata(unauthProfileRef)
      );
    });

    it('should enforce file size limits (5MB)', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const largeImageData = createLargeFile(); // 6MB file
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/large-avatar.jpg`);
      
      await assertFails(
        uploadBytes(profileRef, largeImageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should enforce content type restrictions (images only)', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const textData = new TextEncoder().encode('This is not an image');
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/not-an-image.txt`);
      
      await assertFails(
        uploadBytes(profileRef, textData, {
          contentType: 'text/plain'
        })
      );
    });

    it('should allow various image formats', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      
      // Test JPEG
      const jpegRef = ref(storage, `users/${ALICE_UID}/profile/avatar.jpg`);
      await assertSucceeds(
        uploadBytes(jpegRef, imageData, {
          contentType: 'image/jpeg'
        })
      );

      // Test PNG
      const pngRef = ref(storage, `users/${ALICE_UID}/profile/avatar.png`);
      await assertSucceeds(
        uploadBytes(pngRef, imageData, {
          contentType: 'image/png'
        })
      );

      // Test WebP
      const webpRef = ref(storage, `users/${ALICE_UID}/profile/avatar.webp`);
      await assertSucceeds(
        uploadBytes(webpRef, imageData, {
          contentType: 'image/webp'
        })
      );

      // Test GIF
      const gifRef = ref(storage, `users/${ALICE_UID}/profile/avatar.gif`);
      await assertSucceeds(
        uploadBytes(gifRef, imageData, {
          contentType: 'image/gif'
        })
      );
    });

    it('should allow users to delete their own profile pictures', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      // First upload a profile picture
      const imageData = createTestImageFile();
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await uploadBytes(profileRef, imageData, {
        contentType: 'image/jpeg'
      });

      // Then delete it
      await assertSucceeds(
        deleteObject(profileRef)
      );
    });

    it('should deny users from deleting other users profile pictures', async () => {
      // Alice uploads her profile picture
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const aliceStorage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(aliceStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await uploadBytes(profileRef, imageData, {
        contentType: 'image/jpeg'
      });

      // Bob tries to delete Alice's profile picture
      const bob = testEnv.authenticatedContext(BOB_UID);
      const bobStorage = bob.storage();
      const bobProfileRef = ref(bobStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertFails(
        deleteObject(bobProfileRef)
      );
    });

    it('should deny unauthenticated users from uploading files', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const storage = unauth.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertFails(
        uploadBytes(profileRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should deny unauthenticated users from deleting files', async () => {
      // First, Alice uploads her profile picture
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const aliceStorage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(aliceStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await uploadBytes(profileRef, imageData, {
        contentType: 'image/jpeg'
      });

      // Then unauthenticated user tries to delete it
      const unauth = testEnv.unauthenticatedContext();
      const unauthStorage = unauth.storage();
      const unauthProfileRef = ref(unauthStorage, `users/${ALICE_UID}/profile/avatar.jpg`);
      
      await assertFails(
        deleteObject(unauthProfileRef)
      );
    });
  });

  describe('App Assets Access Control', () => {
    it('should allow anyone to read app assets', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      // Simulate reading an app asset (this would be pre-uploaded by admin)
      const assetRef = ref(storage, 'assets/icons/fitness.png');
      
      // Note: In a real test, we would pre-upload this asset as an admin
      // For this test, we're just checking that the rules would allow it
      // The actual read will fail because the file doesn't exist, but
      // the security rules should allow the attempt
      
      try {
        await getMetadata(assetRef);
      } catch (error: any) {
        // We expect this to fail because the file doesn't exist
        // But it should fail with 'object-not-found', not 'permission-denied'
        expect(error.code).toBe('storage/object-not-found');
      }
    });

    it('should allow unauthenticated users to read app assets', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const storage = unauth.storage();
      
      const assetRef = ref(storage, 'assets/icons/wellness.png');
      
      try {
        await getMetadata(assetRef);
      } catch (error: any) {
        // Should fail with 'object-not-found', not 'permission-denied'
        expect(error.code).toBe('storage/object-not-found');
      }
    });

    it('should deny users from uploading to app assets folder', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const assetRef = ref(storage, 'assets/icons/malicious-icon.png');
      
      await assertFails(
        uploadBytes(assetRef, imageData, {
          contentType: 'image/png'
        })
      );
    });

    it('should deny users from deleting app assets', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const assetRef = ref(storage, 'assets/icons/fitness.png');
      
      await assertFails(
        deleteObject(assetRef)
      );
    });
  });

  describe('Invalid Path Access Control', () => {
    it('should deny access to root level files', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const rootRef = ref(storage, 'root-file.jpg');
      
      await assertFails(
        uploadBytes(rootRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should deny access to arbitrary paths', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const arbitraryRef = ref(storage, 'some/random/path/file.jpg');
      
      await assertFails(
        uploadBytes(arbitraryRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should deny access to system folders', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const systemRef = ref(storage, 'system/config/settings.json');
      
      await assertFails(
        uploadBytes(systemRef, imageData, {
          contentType: 'application/json'
        })
      );
    });
  });

  describe('Edge Cases and Security Vulnerabilities', () => {
    it('should prevent path traversal attacks', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      
      // Try various path traversal attempts
      const maliciousPaths = [
        `users/${ALICE_UID}/../${BOB_UID}/profile/hacked.jpg`,
        `users/${ALICE_UID}/profile/../../${BOB_UID}/profile/hacked.jpg`,
        `users/${ALICE_UID}/profile/../../../assets/hacked.jpg`
      ];

      for (const path of maliciousPaths) {
        const maliciousRef = ref(storage, path);
        
        await assertFails(
          uploadBytes(maliciousRef, imageData, {
            contentType: 'image/jpeg'
          })
        );
      }
    });

    it('should handle empty file names', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const emptyNameRef = ref(storage, `users/${ALICE_UID}/profile/`);
      
      await assertFails(
        uploadBytes(emptyNameRef, imageData, {
          contentType: 'image/jpeg'
        })
      );
    });

    it('should handle special characters in file names', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      
      // Test various special characters
      const specialCharFiles = [
        `users/${ALICE_UID}/profile/avatar with spaces.jpg`,
        `users/${ALICE_UID}/profile/avatar-with-dashes.jpg`,
        `users/${ALICE_UID}/profile/avatar_with_underscores.jpg`,
        `users/${ALICE_UID}/profile/avatar.with.dots.jpg`
      ];

      for (const fileName of specialCharFiles) {
        const fileRef = ref(storage, fileName);
        
        // These should succeed as they are valid file names
        await assertSucceeds(
          uploadBytes(fileRef, imageData, {
            contentType: 'image/jpeg'
          })
        );
      }
    });

    it('should reject files with no content type', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const imageData = createTestImageFile();
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/no-content-type.jpg`);
      
      // Upload without content type should fail
      await assertFails(
        uploadBytes(profileRef, imageData)
      );
    });

    it('should reject zero-byte files', async () => {
      const alice = testEnv.authenticatedContext(ALICE_UID);
      const storage = alice.storage();
      
      const emptyData = new Uint8Array(0);
      const profileRef = ref(storage, `users/${ALICE_UID}/profile/empty.jpg`);
      
      await assertFails(
        uploadBytes(profileRef, emptyData, {
          contentType: 'image/jpeg'
        })
      );
    });
  });
});