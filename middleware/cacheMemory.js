const redisClient = require("../connection/redisConnection");

const cacheMemory = async (req, res, next) => {
  try {
    const cache = await redisClient.get("products");

    if (cache) {
      console.log("✅ Returned from cache");
      return res.status(200).json(JSON.parse(cache)); // Parse string to JSON
    }

    next();
  } catch (error) {
    console.error("❌ Redis Cache Error:", error);
    next(); // Proceed even if Redis fails
  }
};

module.exports = cacheMemory;
