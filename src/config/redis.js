const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Cache middleware
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }
      
      res.originalJson = res.json;
      res.json = async (body) => {
        await redisClient.setex(key, duration, JSON.stringify(body));
        res.originalJson(body);
      };
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Rate limiting middleware
const rateLimiter = (limit, window) => {
  return async (req, res, next) => {
    const key = `ratelimit:${req.ip}`;
    try {
      const requests = await redisClient.incr(key);
      if (requests === 1) {
        await redisClient.expire(key, window);
      }
      
      if (requests > limit) {
        return res.status(429).json({
          error: 'Too many requests, please try again later.'
        });
      }
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };
};

module.exports = {
  redisClient,
  cacheMiddleware,
  rateLimiter
}; 