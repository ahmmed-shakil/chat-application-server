import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

// Socket controller
// Routes
import authRoutes from "./src/routes/auth.routes";
import userRoutes from "./src/routes/user";
import messageRoutes from "./src/routes/message";
import chatRoutes from "./src/routes/chat";
import { setupSocketHandlers } from "./src/socket/socketController";

// Load environment variables

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Static files for uploaded media
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket handlers
setupSocketHandlers(io);

// Make io available globally for controllers
app.set("io", io);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);
setupSocketHandlers(io);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/whatsapp-clone";
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("Hello!");

export default app;
