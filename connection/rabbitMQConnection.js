const amqp = require("amqplib");

const QUEUE_NAME = "chat-messages";
const RABBITMQ_URL = "amqp://myuser:mypassword@13.61.24.185:5672";

let channel; // Declare globally
let connection; // Store connection for proper handling

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    const queueInfo=await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(queueInfo);
    console.log("✅ RabbitMQ connected"); 

    // Handle connection close & auto-reconnect
    connection.on("close", () => {
      console.error("❌ RabbitMQ connection closed! Reconnecting...");
      return setTimeout(connectRabbitMQ, 5000); // Retry after 5s
    });

    connection.on("error", (err) => {
      console.error("❌ RabbitMQ error:", err);
    });

  } catch (err) {
    console.error("❌ RabbitMQ connection Error:", err);
    setTimeout(connectRabbitMQ, 5000); // Retry after 5s if connection fails
  }
}

// Ensure connectRabbitMQ() is called before using `channel`
module.exports = {
  QUEUE_NAME,
  getChannel: () => channel, // Use a function to access the channel after it's initialized
  connectRabbitMQ
};
