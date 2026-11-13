import { createHash, randomBytes } from 'crypto';
import { config } from '../config';

/**
 * Email verification tokens prove that the account owner can read the account's mailbox: they are only ever emailed.
 * Only their SHA-256 hash is stored.
 */
export const generateEmailVerificationToken = (): string => randomBytes(32).toString('hex');

export const hashEmailVerificationToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const verifyEmailUrl = (token: string): string => `${config.virtualHost}/verify-email?token=${token}`;

export const EMAIL_VERIFICATION_VALID_DAYS = 7;
