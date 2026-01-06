const redis = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      password: process.env.REDIS_PASSWORD || 'redis123',
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    console.warn('Continuing without Redis...');
    return null;
  }
};

const getClient = () => client;

const disconnect = async () => {
  if (client) {
    await client.quit();
  }
};

// Cache helper object
const cache = {
  async set(key, value, ttlSeconds = 3600) {
    if (!client) return null;
    try {
      const serialized = JSON.stringify(value);
      await client.set(key, serialized, { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return null;
    }
  },

  async get(key) {
    if (!client) return null;
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async del(key) {
    if (!client) return null;
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return null;
    }
  }
};

module.exports = {
  connectRedis,
  getClient,
  getRedisClient: getClient,
  disconnect,
  cache
};