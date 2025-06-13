const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/redis');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new Error('Token has been invalidated');
    }

    // Check if token exists in Redis
    const isValidToken = await redisClient.get(`token:${token}`);
    if (!isValidToken) {
      throw new Error('Token is not valid');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = auth; 