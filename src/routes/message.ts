import express, { type RequestHandler } from "express";
import {
  sendMessage,
  getMessages,
  uploadFile,
} from "../controllers/messageController";
import { protect } from "../middleware/auth";
import multer from "multer";

const messageRoutes = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Protect all routes
messageRoutes.use(protect as RequestHandler);

// Send a message
messageRoutes.post("/", sendMessage as RequestHandler);

// Get messages for a chat
messageRoutes.get("/:chatId", getMessages as RequestHandler);

// Upload file (image, audio, document, etc.)
messageRoutes.post(
  "/upload",
  upload.single("file"),
  uploadFile as RequestHandler
);

export default messageRoutes;
