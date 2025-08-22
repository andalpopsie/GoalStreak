// Simple Firebase connection test
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const testFirebaseConnection = async (userId: string) => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to write a simple test document
    const testDoc = {
      test: true,
      userId,
      timestamp: new Date(),
    };
    
    const docRef = await addDoc(collection(db, 'test'), testDoc);
    console.log('✅ Firebase connection successful! Document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};
