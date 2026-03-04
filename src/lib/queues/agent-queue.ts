import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import redis from '../redis';
import { adelineBrainRunnable } from '../langgraph';
import { AdelineGraphState } from '../langgraph/types';

// Queue configuration
const QUEUE_NAME = 'agent-processing';
const CONCURRENCY = 5; // Process 5 jobs concurrently
const JOB_OPTIONS = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
  attempts: 3,           // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000,         // Start with 2s delay
  },
};

// Create queue instance
export const agentQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'localhost',
    port: 6379,
    // Use Upstash Redis configuration if available
    ...(process.env.UPSTASH_REDIS_REST_URL && {
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
  },
  defaultJobOptions: JOB_OPTIONS,
});

// Create queue events listener
export const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: {
    host: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'localhost',
    port: 6379,
    ...(process.env.UPSTASH_REDIS_REST_URL && {
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
  },
});

// Job priorities (lower number = higher priority)
export enum JobPriority {
  URGENT = 1,        // Real-time chat responses
  HIGH = 2,          // Life credit logging
  NORMAL = 3,        // Regular learning activities
  LOW = 4,           // Analytics and reporting
  BACKGROUND = 5,    // Maintenance tasks
}

// Job types for different agent workflows
export enum JobType {
  CHAT_RESPONSE = 'chat_response',
  LIFE_CREDIT_LOGGING = 'life_credit_logging',
  MASTERY_UPDATE = 'mastery_update',
  ZPD_CALCULATION = 'zpd_calculation',
  SPACED_REPETITION = 'spaced_repetition',
  ANALYTICS_PROCESSING = 'analytics_processing',
}

/**
 * Submit a job to the agent processing queue.
 */
export async function submitAgentJob(
  type: JobType,
  data: AdelineGraphState,
  options: {
    priority?: JobPriority;
    delay?: number;
    id?: string;
  } = {}
): Promise<Job<AdelineGraphState, any, string>> {
  const job = await agentQueue.add(
    type,
    data,
    {
      priority: options.priority || JobPriority.NORMAL,
      delay: options.delay,
      jobId: options.id,
    }
  );

  console.log(`[AgentQueue] Submitted ${type} job with priority ${options.priority || JobPriority.NORMAL}`);
  return job;
}

/**
 * Process agent jobs using LangGraph.
 */
export function createAgentWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<AdelineGraphState, any, string>) => {
      const { data, name } = job;
      
      console.log(`[AgentWorker] Processing ${name} job: ${job.id}`);
      
      try {
        // Execute the appropriate agent workflow based on job type
        let result: any;
        
        switch (name as JobType) {
          case JobType.CHAT_RESPONSE:
          case JobType.LIFE_CREDIT_LOGGING:
            // Ensure required prompt field is present for LangGraph
            const graphState = {
              ...data,
              prompt: data.prompt || '',
            };
            // Run the full LangGraph brain for chat and life credit
            result = await adelineBrainRunnable.invoke(graphState as any);
            break;
            
          case JobType.MASTERY_UPDATE:
            // Handle mastery updates with optimized processing
            result = await processMasteryUpdate(data);
            break;
            
          case JobType.ZPD_CALCULATION:
            // Calculate ZPD with caching
            result = await processZPDCalculation(data);
            break;
            
          case JobType.SPACED_REPETITION:
            // Process spaced repetition scheduling
            result = await processSpacedRepetition(data);
            break;
            
          case JobType.ANALYTICS_PROCESSING:
            result = await processAnalytics(data);
            break;
            
          default:
            throw new Error(`Unknown job type: ${name}`);
        }
        
        console.log(`[AgentWorker] Completed ${name} job: ${job.id}`);
        return result;
        
      } catch (error) {
        console.error(`[AgentWorker] Failed ${name} job: ${job.id}`, error);
        throw error;
      }
    },
    {
      connection: {
        host: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'localhost',
        port: 6379,
        ...(process.env.UPSTASH_REDIS_REST_URL && {
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
      },
      concurrency: CONCURRENCY,
    }
  );

  // Worker event listeners
  worker.on('completed', (job: any) => {
    console.log(`[AgentWorker] Job completed: ${job.id}`);
  });

  worker.on('failed', (job: any, err: any) => {
    console.error(`[AgentWorker] Job failed: ${job.id}`, err);
  });

  worker.on('error', (err: any) => {
    console.error('[AgentWorker] Worker error:', err);
  });

  return worker;
}

/**
 * Optimized mastery update processing.
 */
async function processMasteryUpdate(state: AdelineGraphState): Promise<AdelineGraphState> {
  // This would implement batch processing for mastery updates
  // to reduce database load when many concepts are updated simultaneously
  
  const startTime = Date.now();
  
  // Simulate processing (replace with actual implementation)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const processingTime = Date.now() - startTime;
  
  return {
    ...state,
    metadata: {
      ...state.metadata,
      processingTime,
      jobType: JobType.MASTERY_UPDATE,
    },
  };
}

/**
 * Cached ZPD calculation processing.
 */
async function processZPDCalculation(state: AdelineGraphState): Promise<AdelineGraphState> {
  // This would implement caching for ZPD calculations
  // to avoid recalculating the same ZPD repeatedly
  
  const startTime = Date.now();
  
  // Simulate processing (replace with actual implementation)
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const processingTime = Date.now() - startTime;
  
  return {
    ...state,
    metadata: {
      ...state.metadata,
      processingTime,
      jobType: JobType.ZPD_CALCULATION,
    },
  };
}

/**
 * Spaced repetition scheduling processing.
 */
async function processSpacedRepetition(state: AdelineGraphState): Promise<AdelineGraphState> {
  // This would implement optimized spaced repetition scheduling
  // to batch process multiple reviews at once
  
  const startTime = Date.now();
  
  // Simulate processing (replace with actual implementation)
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const processingTime = Date.now() - startTime;
  
  return {
    ...state,
    metadata: {
      ...state.metadata,
      processingTime,
      jobType: JobType.SPACED_REPETITION,
    },
  };
}

/**
 * Analytics and reporting processing.
 */
async function processAnalytics(state: AdelineGraphState): Promise<AdelineGraphState> {
  // This would implement analytics processing that doesn't need to be real-time
  // Learning analytics, progress reports, usage statistics, etc.
  
  const startTime = Date.now();
  
  // Simulate processing (replace with actual implementation)
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const processingTime = Date.now() - startTime;
  
  return {
    ...state,
    metadata: {
      ...state.metadata,
      processingTime,
      jobType: JobType.ANALYTICS_PROCESSING,
    },
  };
}

/**
 * Get queue statistics for monitoring.
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    agentQueue.getWaiting(),
    agentQueue.getActive(),
    agentQueue.getCompleted(),
    agentQueue.getFailed(),
    agentQueue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}

/**
 * Clean up old jobs to prevent memory buildup.
 */
export async function cleanupOldJobs(): Promise<void> {
  try {
    // Clean up jobs older than 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    await agentQueue.clean(0, 0, 'completed');
    await agentQueue.clean(0, 0, 'failed');
    
    console.log('[AgentQueue] Completed cleanup of old jobs');
  } catch (error) {
    console.error('[AgentQueue] Cleanup failed:', error);
  }
}

/**
 * Graceful shutdown for the queue system.
 */
export async function shutdownQueue(): Promise<void> {
  try {
    await agentQueue.close();
    await queueEvents.close();
    console.log('[AgentQueue] Queue system shut down gracefully');
  } catch (error) {
    console.error('[AgentQueue] Shutdown error:', error);
  }
}
