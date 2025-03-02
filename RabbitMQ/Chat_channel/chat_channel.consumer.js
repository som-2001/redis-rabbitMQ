const {
  QUEUE_NAME,
  connectRabbitMQ,
  getChannel,
} = require("../../connection/rabbitMQConnection");

let messages = [];

async function startWorker() {
  console.log("🔄 Consumer starting...");

  // Ensure RabbitMQ is connected before consuming messages
  await connectRabbitMQ();
  const channel = await getChannel();

  if (!channel) {
    console.error("❌ RabbitMQ Channel is not ready!");
    return;
  }

  console.log("✅ Consumer connected, waiting for messages...");

  channel.consume(QUEUE_NAME, (msg) => {
    if (msg !== null) {
      console.log("📩 Received In Consumer:", msg.content.toString());
      // Push message to array
      messages.push(JSON.parse(msg.content.toString()));
    
      // Acknowledge message
      channel.ack(msg);
    }
  });
}

// Start the consumer
module.exports=startWorker;
