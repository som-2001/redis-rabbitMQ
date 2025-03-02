const redis = require("redis");
//redis://default:jdrQjliTfRnZrByqoLV1Iqq8jJZf9vzo@redis-11749.c85.us-east-1-2.ec2.redns.redis-cloud.com:11749
const redisClient = redis.createClient({
  url: "redis://13.61.24.185:6379",
});

redisClient.on("error", (err) => console.error("❌ Redis error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
})();


module.exports = {redisClient};
