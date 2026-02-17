import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processJob } from '@/lib/jobs/processor';

/**
 * POST /api/jobs/process
 * 
 * Worker endpoint to process PENDING jobs.
 * Can be triggered by Vercel Cron or external scheduler.
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Find PENDING jobs (limit to batch size to avoid timeout)
    const jobs = await prisma.aIJob.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    if (jobs.length === 0) {
      return NextResponse.json({ message: 'No pending jobs', count: 0 });
    }

    console.log(`[JobWorker] Processing ${jobs.length} pending jobs...`);

    // 2. Process them concurrently
    const results = await Promise.allSettled(jobs.map(async (job) => {
      // Reconstruct state from job metadata
      const meta = job.metadata as any;
      
      await processJob(job.id, job.prompt, {
        userId: job.userId || undefined,
        conversationHistory: meta?.fullHistory || [],
        studentContext: meta?.studentContext,
        ...meta
      });
      return job.id;
    }));

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Processed ${jobs.length} jobs`,
      succeeded,
      failed
    });

  } catch (error) {
    console.error('[JobWorker] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
