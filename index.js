const express = require("express");
const { createClient } = require("redis");
const { Server } = require("socket.io");
const {
  QUEUE_NAME,
  connectRabbitMQ,
  getChannel,
} = require("./connection/rabbitMQConnection");
const startWorker = require("./RabbitMQ/Chat_channel/chat_channel.consumer");
const { redisClient } = require("./connection/redisConnection");

const app = express();
const server = require("http").createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Redis Pub/Sub Setup

startWorker();
const publisher = createClient();
const subscriber = createClient();
(async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
    console.log("✅ Redis Publisher & Subscriber connected");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
})();
connectRabbitMQ();

const users = {};
// Subscribe to Redis
subscriber.subscribe("chat_channel", (message, channel) => {
  console.log("subscribed...");
  console.log(`📩 Message received: ${message} ${channel}`);
  io.to(JSON.parse(message).text.room).emit("new_message", JSON.parse(message));
});

subscriber.subscribe("room_joined_user", (message, channel) => {
  console.log(`📩 Room joined: ${message} ${channel}`);
  io.to(JSON.parse(message)).emit("room_joined");
});

subscriber.subscribe("disconnected", (message, channel) => {
  console.log(`📩 Room left: ${message} ${channel}`);
  io.to(JSON.parse(message).room).emit("disconnected", JSON.parse(message));
});
io.on("connection", async (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("room_join", (data) => {
    socket.join(data);
    console.log(data);
    users[socket.id] = {
      room: data,
    };
    publisher.publish("room_joined_user", JSON.stringify(data));
  });

  // Publish a message
  socket.on("send_message", async (msg) => {
    const data = { sender: socket.id, text: msg };

    getChannel().sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    });
    await publisher.publish("chat_channel", JSON.stringify(data));
  });

  socket.on("disconnect", async () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    await publisher.publish(
      "disconnected",
      JSON.stringify({ id: socket.id, room: users?.[socket?.id]?.room })
    );
  });
});

app.use(express.json()); // Middleware to parse JSON body

app.post("/api/create", async (req, res) => {
  try {
    const { id, ...rest } = req.body; // Extract ID and other data
    if (!id) {
      return res.status(400).json({ message: "ID is required!" });
    }

    await redisClient.setEx(id, 10, JSON.stringify(rest)); // Use `id` as the key
    return res.status(201).json({ message: "Created successfully!!" });
  } catch (error) {
    console.error("❌ Redis Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Redis & RabbitMQ is listening!!!...");
});

server.listen(3001, () => console.log("🚀 Server running on 3001"));
