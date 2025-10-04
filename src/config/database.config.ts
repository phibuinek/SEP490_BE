export const databaseConfig = {
  uri: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    // 🚀 OPTIMIZATION: Increase timeouts for better reliability
    serverSelectionTimeoutMS: 15000, // Increased from 5000
    socketTimeoutMS: 60000, // Increased from 45000
    bufferCommands: false,
    retryWrites: true,
    retryReads: true,
    // Connection pool settings
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 15000, // Increased from 5000
    // Heartbeat settings
    heartbeatFrequencyMS: 10000,
    // Additional optimizations
    connectTimeoutMS: 15000,
    maxConnecting: 5,
  },
};

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  enableReadyCheck: false,
};
