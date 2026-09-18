import { Timestamp } from 'firebase-admin/firestore';

export type ProGrantStatus = 'pending' | 'granted';

export interface FoundingRecord {
  number: number;
  grantedAt: Timestamp;
  proExpiresAt: Timestamp | null;
  proGrantStatus: ProGrantStatus;
  lastAttemptAt?: Timestamp | null;
}

export interface FoundingProfileFields {
  foundingMember: boolean;
  foundingNumber: number;
  foundingRecord?: FoundingRecord;
}
