import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs/queue';

/**
 * GET /api/jobs/[id] — Poll for job status and result.
 *
 * Returns the current job state. Client polls until status is COMPLETED or FAILED.
 *
 * Optional: ?wait=5 to long-poll for up to 5 seconds before returning.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const waitSeconds = Number(req.nextUrl.searchParams.get('wait')) || 0;

  let job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Long-poll: wait up to N seconds for completion
  if (waitSeconds > 0 && (job.status === 'PENDING' || job.status === 'PROCESSING')) {
    const deadline = Date.now() + Math.min(waitSeconds, 30) * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
      job = await getJob(id);
      if (!job || job.status === 'COMPLETED' || job.status === 'FAILED') break;
    }
  }

  return NextResponse.json(job);
}
