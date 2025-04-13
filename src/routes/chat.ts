import express, { type RequestHandler } from "express";
import {
  accessChat,
  getUserChats,
  createGroupChat,
  updateGroupChat,
  addToGroup,
  removeFromGroup,
} from "../controllers/chatController";
import { protect } from "../middleware/auth";

const router = express.Router();

// Protect all routes
router.use(protect as RequestHandler);

// Get or create one-on-one chat
router.post("/", accessChat as RequestHandler);

// Get all chats for a user
router.get("/", getUserChats);

// Create a group chat
router.post("/group", createGroupChat as RequestHandler);

// Update a group chat
router.put("/group", updateGroupChat as RequestHandler);

// Add user to group
router.put("/group/add", addToGroup as RequestHandler);

// Remove user from group
router.put("/group/remove", removeFromGroup as RequestHandler);

export default router;
