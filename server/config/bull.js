const Queue = require('bull');
const redis = require('redis');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  maxRetriesPerRequest: 1,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true
};

// Track Redis availability
let redisAvailable = false;
let redisInitialized = false;
let redisWarningShown = false;

// Create Redis client with error handling
let redisClient = null;

async function initializeRedis() {
  if (redisInitialized) return;
  redisInitialized = true;

  try {
    redisClient = redis.createClient(redisConfig);

    redisClient.on('error', (err) => {
      if (!redisAvailable && !redisWarningShown) {
        console.warn('⚠️  Redis not available - using fallback mode (scans will run immediately)');
        redisAvailable = false;
        redisWarningShown = true;
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis server - queue system enabled');
      redisAvailable = true;
    });

    redisClient.on('ready', () => {
      redisAvailable = true;
    });

    redisClient.on('end', () => {
      redisAvailable = false;
    });

    // Test connection with timeout
    const connectionPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 2000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);
  } catch (error) {
    if (!redisWarningShown) {
      console.warn('⚠️  Redis connection failed - scans will execute immediately');
      redisWarningShown = true;
    }
    redisAvailable = false;
    if (redisClient) {
      redisClient.removeAllListeners();
      redisClient = null;
    }
  }
}

// Initialize Redis on startup (only once)
initializeRedis();

// Queue configurations
const queueConfigs = {
  'vulnerability-scan': {
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  },
  'threat-monitoring': {
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 10,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10000
      }
    }
  },
  'notification': {
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 20,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },
  'report-generation': {
    defaultJobOptions: {
      removeOnComplete: 5,
      removeOnFail: 3,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 30000
      }
    }
  },
  'ai-analysis': {
    defaultJobOptions: {
      removeOnComplete: 15,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    }
  }
};

// Store active queues
const activeQueues = new Map();

// Mock queue for fallback when Redis is not available
class MockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = [];
    this.handlers = new Map();
  }

  async add(jobType, data, options = {}) {
    console.log(`⚠️  Redis unavailable - running job immediately: ${jobType}`);
    
    // If we have a handler for this job type, run it immediately
    const handler = this.handlers.get(jobType);
    if (handler) {
      try {
        const mockJob = { id: Date.now(), data, processedOn: Date.now() };
        console.log(`🔄 Executing ${jobType} immediately...`);
        const result = await handler(mockJob);
        console.log(`✅ Job ${jobType} completed successfully`);
        
        // Emit completed event if there's a listener
        if (this.completedListeners) {
          this.completedListeners.forEach(listener => {
            try {
              listener(mockJob, result);
            } catch (err) {
              console.error('Error in completed listener:', err);
            }
          });
        }
      } catch (error) {
        console.error(`❌ Job ${jobType} failed:`, error);
        
        // Emit failed event if there's a listener
        if (this.failedListeners) {
          this.failedListeners.forEach(listener => {
            try {
              listener(mockJob, error);
            } catch (err) {
              console.error('Error in failed listener:', err);
            }
          });
        }
      }
    } else {
      console.warn(`⚠️  No handler registered for job type: ${jobType}`);
    }
    
    // Return a mock job
    return {
      id: Date.now(),
      data,
      processedOn: Date.now()
    };
  }

  process(jobType, handler) {
    console.log(`📝 Registered handler for ${jobType} (will run synchronously)`);
    this.handlers.set(jobType, handler);
  }

  on(event, callback) {
    // Store event listeners
    if (event === 'completed') {
      if (!this.completedListeners) this.completedListeners = [];
      this.completedListeners.push(callback);
    } else if (event === 'failed') {
      if (!this.failedListeners) this.failedListeners = [];
      this.failedListeners.push(callback);
    }
  }

  async getWaiting() { return []; }
  async getActive() { return []; }
  async getCompleted() { return []; }
  async getFailed() { return []; }
  async getDelayed() { return []; }
  async close() { }
  async pause() { }
  async resume() { }
  async clean() { }
}

// Create or get queue
function createBullQueue(queueName, options = {}) {
  if (activeQueues.has(queueName)) {
    return activeQueues.get(queueName);
  }

  let queue;

  // Always use MockQueue if Redis is not available (don't retry)
  if (!redisAvailable || !redisClient) {
    if (!activeQueues.has(`${queueName}-mock-warning`) && !redisWarningShown) {
      console.warn(`🔄 Creating immediate-execution queue for ${queueName} (Redis unavailable)`);
      activeQueues.set(`${queueName}-mock-warning`, true); // Prevent duplicate warnings
    }
    queue = new MockQueue(queueName);
  } else {
    try {
      const config = queueConfigs[queueName] || queueConfigs['vulnerability-scan'];
      
      queue = new Queue(queueName, {
        redis: redisConfig,
        ...config,
        ...options
      });

      // Global queue event handlers
      queue.on('error', (error) => {
        console.error(`Queue ${queueName} error:`, error.message);
        // Don't set redisAvailable to false here to prevent cascading failures
      });

      console.log(`✅ Created Redis-backed queue: ${queueName}`);
    } catch (error) {
      console.warn(`⚠️  Failed to create Redis queue ${queueName}, using immediate execution`);
      queue = new MockQueue(queueName);
    }
  }

  queue.on('waiting', (jobId) => {
    console.log(`Job ${jobId} is waiting in queue ${queueName}`);
  });

  queue.on('active', (job) => {
    console.log(`Job ${job.id} started processing in queue ${queueName}`);
  });

  queue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed in queue ${queueName}`);
  });

  queue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed in queue ${queueName}:`, err.message);
  });

  queue.on('stalled', (job) => {
    console.warn(`Job ${job.id} stalled in queue ${queueName}`);
  });

  // Store queue reference
  activeQueues.set(queueName, queue);

  return queue;
}

// Get queue statistics
async function getQueueStats(queueName) {
  const queue = activeQueues.get(queueName);
  if (!queue) return null;

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      name: queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      },
      jobs: {
        waiting: waiting.slice(0, 5).map(job => ({
          id: job.id,
          data: job.data,
          createdAt: job.timestamp
        })),
        active: active.slice(0, 5).map(job => ({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          processedOn: job.processedOn
        })),
        failed: failed.slice(0, 5).map(job => ({
          id: job.id,
          data: job.data,
          failedReason: job.failedReason,
          failedAt: job.finishedOn
        }))
      }
    };
  } catch (error) {
    console.error(`Error getting stats for queue ${queueName}:`, error);
    return null;
  }
}

// Get all queue statistics
async function getAllQueueStats() {
  const stats = {};
  
  for (const queueName of activeQueues.keys()) {
    stats[queueName] = await getQueueStats(queueName);
  }
  
  return stats;
}

// Clean up completed and failed jobs
async function cleanupQueues() {
  console.log('Cleaning up queues...');
  
  for (const [queueName, queue] of activeQueues.entries()) {
    try {
      // Remove completed jobs older than 24 hours
      await queue.clean(24 * 60 * 60 * 1000, 'completed');
      
      // Remove failed jobs older than 7 days
      await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
      
      console.log(`Cleaned up queue: ${queueName}`);
    } catch (error) {
      console.error(`Error cleaning queue ${queueName}:`, error);
    }
  }
}

// Pause all queues
async function pauseAllQueues() {
  for (const [queueName, queue] of activeQueues.entries()) {
    try {
      await queue.pause();
      console.log(`Paused queue: ${queueName}`);
    } catch (error) {
      console.error(`Error pausing queue ${queueName}:`, error);
    }
  }
}

// Resume all queues
async function resumeAllQueues() {
  for (const [queueName, queue] of activeQueues.entries()) {
    try {
      await queue.resume();
      console.log(`Resumed queue: ${queueName}`);
    } catch (error) {
      console.error(`Error resuming queue ${queueName}:`, error);
    }
  }
}

// Close all queues gracefully
async function closeAllQueues() {
  console.log('Closing all queues...');
  
  for (const [queueName, queue] of activeQueues.entries()) {
    try {
      await queue.close();
      console.log(`Closed queue: ${queueName}`);
    } catch (error) {
      console.error(`Error closing queue ${queueName}:`, error);
    }
  }
  
  activeQueues.clear();
  
  // Close Redis client
  if (redisClient) {
    redisClient.quit();
  }
}

// Schedule periodic cleanup
setInterval(cleanupQueues, 60 * 60 * 1000); // Every hour

// Graceful shutdown
process.on('SIGTERM', closeAllQueues);
process.on('SIGINT', closeAllQueues);

module.exports = {
  createBullQueue,
  getQueueStats,
  getAllQueueStats,
  cleanupQueues,
  pauseAllQueues,
  resumeAllQueues,
  closeAllQueues,
  redisClient,
  isRedisAvailable: () => redisAvailable
};