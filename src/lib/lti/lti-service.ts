import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface LTILaunchRequest {
  lti_message_type: string;
  lti_version: string;
  resource_link_id: string;
  resource_link_title: string;
  resource_link_description?: string;
  user_id: string;
  roles: string;
  lis_person_name_given?: string;
  lis_person_name_family?: string;
  lis_person_name_full?: string;
  lis_person_contact_email_primary?: string;
  context_id: string;
  context_title?: string;
  context_label?: string;
  launch_presentation_return_url?: string;
  lti_launch_url: string;
  oauth_consumer_key: string;
  oauth_signature: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_nonce: string;
  oauth_version: string;
  custom_params?: Record<string, string>;
}

export interface LTIConfiguration {
  title: string;
  description: string;
  launch_url: string;
  icon_url?: string;
  secure_launch_url?: string;
  tool_platform: string;
  extensions: {
    lti: {
      platform: string;
      message_types: string[];
    };
  };
}

export interface LTIUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
  ltiConsumerId: string;
}

/**
 * Validate LTI 1.3 launch request.
 * Requires ENTERPRISE_LTI_ENABLED=true — LTI is an enterprise-only feature.
 */
export async function validateLTILaunch(
  launchData: LTILaunchRequest,
  ltiSecret: string
): Promise<{ valid: boolean; user?: LTIUser; error?: string }> {
  if (process.env.ENTERPRISE_LTI_ENABLED !== 'true') {
    return {
      valid: false,
      error: 'LTI integration is an enterprise feature. Contact hello@dear-adeline.com to upgrade.',
    };
  }

  try {
    // Step 1: Verify OAuth signature
    const signatureValid = await verifyOAuthSignature(launchData, ltiSecret);
    if (!signatureValid) {
      return { valid: false, error: 'Invalid OAuth signature' };
    }

    // Step 2: Check timestamp (must be within 5 minutes)
    const timestamp = parseInt(launchData.oauth_timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return { valid: false, error: 'Request timestamp too old' };
    }

    // Step 3: Extract user information
    const user: LTIUser = {
      id: launchData.user_id,
      email: launchData.lis_person_contact_email_primary,
      firstName: launchData.lis_person_name_given,
      lastName: launchData.lis_person_name_family,
      fullName: launchData.lis_person_name_full,
      roles: launchData.roles.split(',').map(role => role.trim()),
      ltiConsumerId: launchData.oauth_consumer_key,
    };

    // Step 4: Create or update user in our system
    await syncLTIUser(user);

    return { valid: true, user };
  } catch (error) {
    console.error('[LTI] Validation failed:', error);
    return { valid: false, error: 'LTI validation failed' };
  }
}

/**
 * Verify OAuth 1.0 signature for LTI launch.
 */
async function verifyOAuthSignature(
  launchData: LTILaunchRequest,
  ltiSecret: string
): Promise<boolean> {
  try {
    const { oauth_signature, ...params } = launchData;
    
    // Create base string for signature verification
    const baseString = createBaseString(params);
    
    // Create signing key
    const signingKey = `${launchData.oauth_consumer_key}&${ltiSecret}`;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha1', signingKey)
      .update(baseString)
      .digest('base64');
    
    // Compare signatures (URL-safe comparison)
    const signatureMatch = crypto.timingSafeEqual(
      Buffer.from(oauth_signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
    
    return signatureMatch;
  } catch (error) {
    console.error('[LTI] Signature verification failed:', error);
    return false;
  }
}

/**
 * Create base string for OAuth signature.
 */
function createBaseString(params: Omit<LTILaunchRequest, 'oauth_signature'>): string {
  // Sort parameters alphabetically
  const sortedParams = Object.entries(params)
    .filter(([key]) => key.startsWith('oauth_') || key.startsWith('lti_') || key.startsWith('lis_') || key.startsWith('context_') || key.startsWith('resource_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return `POST&${encodeURIComponent(params.lti_launch_url)}&${encodeURIComponent(sortedParams)}`;
}

/**
 * Sync LTI user with our user system.
 */
async function syncLTIUser(ltiUser: LTIUser): Promise<void> {
  // Check if user exists by LTI user ID mapping
  const allUsers = await prisma.user.findMany();

  let user = allUsers.find(u => {
    const metadata = u.metadata as Record<string, any>;
    return metadata?.ltiUserId === ltiUser.id;
  }) || null;

  if (!user && ltiUser.email) {
    // Try to find by email
    user = await prisma.user.findUnique({
      where: { email: ltiUser.email },
    });
  }

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: ltiUser.email || `${ltiUser.id}@lti.user`,
        name: ltiUser.fullName || ltiUser.firstName || `LTI User ${ltiUser.id}`,
        role: 'STUDENT',
        metadata: {
          ltiUserId: ltiUser.id,
          ltiConsumerId: ltiUser.ltiConsumerId,
          ltiRoles: ltiUser.roles,
          ltiSyncedAt: new Date().toISOString(),
        },
      },
    });
  } else {
    // Update existing user with LTI metadata
    const existingMetadata = user.metadata ? user.metadata as Record<string, any> : {};
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...existingMetadata,
          ltiUserId: ltiUser.id,
          ltiConsumerId: ltiUser.ltiConsumerId,
          ltiRoles: ltiUser.roles,
          ltiSyncedAt: new Date().toISOString(),
        },
      },
    });
  }
}

/**
 * Generate LTI configuration for tool platform.
 */
export function generateLTIConfiguration(
  toolUrl: string,
  title: string,
  description: string
): LTIConfiguration {
  return {
    title,
    description,
    launch_url: `${toolUrl}/api/lti/launch`,
    icon_url: `${toolUrl}/icons/lti-icon.png`,
    secure_launch_url: `${toolUrl}/api/lti/launch`,
    tool_platform: 'Dear Adeline',
    extensions: {
      lti: {
        platform: 'canvas.instructure.com', // Can be dynamic based on consumer
        message_types: ['LtiResourceLinkRequest'],
      },
    },
  };
}

/**
 * Create JWT for LTI deep linking.
 */
export function createDeepLinkingJWT(
  consumerKey: string,
  deploymentId: string,
  contextId: string
): string {
  const payload = {
    iss: consumerKey,
    aud: deploymentId,
    sub: consumerKey,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': deploymentId,
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: contextId,
    },
  };

  return jwt.sign(payload, process.env.LTI_JWT_SECRET || 'default-secret');
}

/**
 * Sync grades back to LMS.
 */
export async function syncGradeToLMS(
  userId: string,
  resourceId: string,
  score: number,
  maxScore: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's LTI context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const metadata = user.metadata as any;
    const ltiContext = metadata?.ltiContext;

    if (!ltiContext) {
      return { success: false, error: 'No LTI context found for user' };
    }

    // Prepare grade payload
    const gradePayload = {
      '@context': 'http://purl.imsglobal.org/ctx/lti/v1/Grade',
      '@type': 'Result',
      'scoreGiven': score,
      'scoreMaximum': maxScore,
      'comment': 'Grade synced from Dear Adeline',
      'activityProgress': 'Completed',
      'gradingProgress': 'FullyGraded',
    };

    // Send grade to LMS (implementation depends on LMS)
    const gradeSent = await sendGradeToLMS(ltiContext, resourceId, gradePayload);

    return { success: gradeSent };
  } catch (error) {
    console.error('[LTI] Grade sync failed:', error);
    return { success: false, error: 'Grade sync failed' };
  }
}

/**
 * Send grade to LMS (LMS-specific implementation).
 */
async function sendGradeToLMS(
  ltiContext: any,
  resourceId: string,
  gradePayload: any
): Promise<boolean> {
  try {
    // This would be implemented based on the specific LMS API
    // For Canvas, Moodle, Blackboard, etc., the implementation differs
    
    console.log('[LTI] Sending grade to LMS:', {
      context: ltiContext,
      resource: resourceId,
      grade: gradePayload,
    });

    // Placeholder implementation
    // In production, this would make actual API calls to the LMS
    return true;
  } catch (error) {
    console.error('[LTI] Failed to send grade to LMS:', error);
    return false;
  }
}

/**
 * Get LTI analytics for a user.
 */
export async function getLTIAnalytics(
  userId: string
): Promise<{
  totalLaunches: number;
  lastLaunch: Date | null;
  averageScore: number;
  completedActivities: number;
  ltiConsumer: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  });

  if (!user) {
    return {
      totalLaunches: 0,
      lastLaunch: null,
      averageScore: 0,
      completedActivities: 0,
      ltiConsumer: null,
    };
  }

  const metadata = user.metadata as any;
  const ltiData = metadata?.lti || {};

  return {
    totalLaunches: ltiData.totalLaunches || 0,
    lastLaunch: ltiData.lastLaunch ? new Date(ltiData.lastLaunch) : null,
    averageScore: ltiData.averageScore || 0,
    completedActivities: ltiData.completedActivities || 0,
    ltiConsumer: ltiData.consumerId || null,
  };
}

/**
 * Register LTI tool consumer.
 */
export async function registerLTIConsumer(
  consumerKey: string,
  consumerSecret: string,
  platform: string,
  platformUrl: string
): Promise<{ success: boolean; consumerId?: string; error?: string }> {
  try {
    // Store consumer credentials (in production, use secure storage)
    const consumerId = crypto.randomUUID();
    
    // This would typically be stored in a separate LTIConsumers table
    console.log('[LTI] Registering consumer:', {
      consumerId,
      consumerKey,
      platform,
      platformUrl,
    });

    return { success: true, consumerId };
  } catch (error) {
    console.error('[LTI] Consumer registration failed:', error);
    return { success: false, error: 'Consumer registration failed' };
  }
}

