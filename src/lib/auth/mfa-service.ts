import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import prisma from '../db';
import crypto from 'crypto';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Generate TOTP secret for MFA setup.
 */
export function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('base64url').replace(/=/g, '');
}

/**
 * Generate backup codes for MFA recovery.
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Generate QR code URL for TOTP setup.
 */
export function generateQRCodeUrl(secret: string, email: string): string {
  const issuer = encodeURIComponent('Dear Adeline');
  const label = encodeURIComponent(`${email} (${issuer})`);
  const secretEncoded = encodeURIComponent(secret);
  
  return `otpauth://totp/${label}?secret=${secretEncoded}&issuer=${issuer}`;
}

/**
 * Setup MFA for a user.
 */
export async function setupUserMFA(userId: string): Promise<MFASetupResult> {
  try {
    // Generate TOTP secret and backup codes
    const secret = generateTOTPSecret();
    const backupCodes = generateBackupCodes();
    
    // Get user email for QR code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    
    if (!user?.email) {
      throw new Error('User not found or no email address');
    }
    
    // Generate QR code URL
    const qrCodeUrl = generateQRCodeUrl(secret, user.email);
    
    // Store MFA setup in database (but don't enable yet)
    await prisma.userMFACredential.upsert({
      where: { userId },
      create: {
        userId,
        secret,
        backupCodes,
        enabled: false, // Requires verification first
      },
      update: {
        secret,
        backupCodes,
        enabled: false,
      },
    });
    
    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  } catch (error) {
    console.error('[MFA] Setup failed:', error);
    throw new Error('Failed to setup MFA');
  }
}

/**
 * Verify TOTP token and enable MFA for user.
 */
export async function verifyAndEnableMFA(
  userId: string, 
  token: string
): Promise<MFAVerificationResult> {
  try {
    // Get user's MFA credentials
    const mfaCredential = await prisma.userMFACredential.findUnique({
      where: { userId },
    });
    
    if (!mfaCredential) {
      return { valid: false, error: 'MFA not setup for this user' };
    }
    
    // Verify TOTP token
    const isValid = await verifyTOTPToken(mfaCredential.secret, token);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid verification code' };
    }
    
    // Enable MFA for user
    await prisma.userMFACredential.update({
      where: { userId },
      data: { enabled: true },
    });
    
    return { valid: true, userId };
  } catch (error) {
    console.error('[MFA] Verification failed:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Verify TOTP token using crypto.
 * Simple implementation for demonstration - in production use 'otplib'
 */
async function verifyTOTPToken(secret: string, token: string): Promise<boolean> {
  try {
    // Simple TOTP verification (30-second window)
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(currentTime / timeStep);
    
    // Generate valid tokens for current and previous time step
    const validTokens = [
      generateTOTP(secret, timeCounter),
      generateTOTP(secret, timeCounter - 1),
      generateTOTP(secret, timeCounter + 1),
    ];
    
    return validTokens.includes(token);
  } catch (error) {
    console.error('[MFA] TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate TOTP token for given time counter.
 */
function generateTOTP(secret: string, counter: number): string {
  // Simple HMAC-based OTP implementation
  // In production, use a proper TOTP library
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter), 0);
  
  // Simple hash-based token (6 digits)
  const hash = crypto.createHmac('sha1', secret).update(buffer).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
  
  return (binary % 1000000).toString().padStart(6, '0');
}

/**
 * Verify backup code.
 */
export async function verifyBackupCode(
  userId: string, 
  backupCode: string
): Promise<MFAVerificationResult> {
  try {
    const mfaCredential = await prisma.userMFACredential.findUnique({
      where: { userId },
    });
    
    if (!mfaCredential) {
      return { valid: false, error: 'MFA not setup for this user' };
    }
    
    const backupCodes = mfaCredential.backupCodes as string[];
    const codeIndex = backupCodes.indexOf(backupCode.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false, error: 'Invalid backup code' };
    }
    
    // Remove used backup code
    const updatedBackupCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    await prisma.userMFACredential.update({
      where: { userId },
      data: { backupCodes: updatedBackupCodes },
    });
    
    return { valid: true, userId };
  } catch (error) {
    console.error('[MFA] Backup code verification failed:', error);
    return { valid: false, error: 'Backup code verification failed' };
  }
}

/**
 * Check if user has MFA enabled.
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  try {
    const mfaCredential = await prisma.userMFACredential.findUnique({
      where: { userId },
      select: { enabled: true },
    });
    
    return mfaCredential?.enabled || false;
  } catch (error) {
    console.error('[MFA] Check enabled failed:', error);
    return false;
  }
}

/**
 * Disable MFA for user.
 */
export async function disableMFA(userId: string): Promise<void> {
  try {
    await prisma.userMFACredential.delete({
      where: { userId },
    });
  } catch (error) {
    console.error('[MFA] Disable failed:', error);
    throw new Error('Failed to disable MFA');
  }
}

/**
 * Generate MFA challenge for login.
 */
export async function generateMFAChallenge(userId: string): Promise<{
  requiresMFA: boolean;
  methods: ('totp' | 'backup_code')[];
}> {
  const mfaEnabled = await isMFAEnabled(userId);
  
  return {
    requiresMFA: mfaEnabled,
    methods: mfaEnabled ? ['totp', 'backup_code'] : [],
  };
}

/**
 * Verify MFA during login process.
 */
export async function verifyLoginMFA(
  userId: string,
  method: 'totp' | 'backup_code',
  code: string
): Promise<MFAVerificationResult> {
  switch (method) {
    case 'totp':
      return verifyTOTPTokenForLogin(userId, code);
    case 'backup_code':
      return verifyBackupCode(userId, code);
    default:
      return { valid: false, error: 'Invalid MFA method' };
  }
}

/**
 * Verify TOTP token specifically for login.
 */
async function verifyTOTPTokenForLogin(
  userId: string, 
  token: string
): Promise<MFAVerificationResult> {
  try {
    const mfaCredential = await prisma.userMFACredential.findUnique({
      where: { userId },
    });
    
    if (!mfaCredential || !mfaCredential.enabled) {
      return { valid: false, error: 'MFA not enabled for this user' };
    }
    
    const isValid = await verifyTOTPToken(mfaCredential.secret, token);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid verification code' };
    }
    
    return { valid: true, userId };
  } catch (error) {
    console.error('[MFA] Login verification failed:', error);
    return { valid: false, error: 'MFA verification failed' };
  }
}

/**
 * Send MFA setup email (for email-based MFA alternative).
 */
export async function sendMFASetupEmail(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    
    if (!user?.email) {
      throw new Error('User email not found');
    }
    
    // In a real implementation, you'd send an email with the setup instructions
    console.log(`[MFA] Setup email sent to: ${user.email}`);
    
    // TODO: Integrate with email service
    // await emailService.sendMFASetupEmail(user.email, setupDetails);
    
  } catch (error) {
    console.error('[MFA] Failed to send setup email:', error);
    throw new Error('Failed to send MFA setup email');
  }
}

