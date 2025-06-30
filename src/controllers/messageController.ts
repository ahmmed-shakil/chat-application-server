/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import Message, { MessageType } from "../models/Message";
import Chat from "../models/Chat";
import User from "../models/User";
import path from "path";
import fs from "fs";

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, content, type = MessageType.TEXT } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: "Please provide chatId and content",
      });
    }

    // Check if chat exists
    const chat = await Chat.findById(chatId).populate(
      "users",
      "name profilePicture"
    );
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is part of the chat
    if (!chat.users.some((user: any) => user._id.toString() === req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    // Create message
    const newMessage = await Message.create({
      sender: req.user?._id,
      content,
      chat: chatId,
      type,
      readBy: [req.user?._id], // Sender has read the message
    });

    // Populate message with sender info
    const message = await Message.findById(newMessage._id)
      .populate("sender", "name profilePicture")
      .populate("chat");

    if (!message) {
      return res.status(500).json({
        success: false,
        message: "Failed to create message",
      });
    }

    // Update chat's lastMessage
    await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

    // Emit socket event for real-time message delivery
    const io = req.app.get("io");
    if (io) {
      // Emit to chat room for real-time display
      io.to(chatId).emit("message-received", message);

      // Emit chat list update
      io.emit("chat-list-update", message);

      // Emit delivery confirmation to sender
      io.to(req.user?.id).emit("message-delivered", {
        messageId: message._id,
        chatId: chatId,
        userId: req.user?.id,
      });
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get messages for a chat
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    // Check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is part of the chat
    if (!chat.users.includes(req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    // Get messages
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name profilePicture")
      .populate("chat")
      .sort({ createdAt: 1 }); // Sort by oldest first

    // Get messages that need to be marked as read
    const unreadMessages = await Message.find({
      chat: chatId,
      readBy: { $ne: req.user?._id }, // Not read by current user
      sender: { $ne: req.user?._id }, // Not sent by current user
    });

    // Mark messages as read
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          chat: chatId,
          readBy: { $ne: req.user?._id }, // Not read by current user
          sender: { $ne: req.user?._id }, // Not sent by current user
        },
        {
          $addToSet: { readBy: req.user?._id }, // Add current user to readBy
        }
      );

      // Emit read events for each message
      const io = req.app.get("io");
      if (io) {
        unreadMessages.forEach((message) => {
          io.emit("message-read-update", {
            messageId: message._id,
            userId: req.user?.id,
            chatId: chatId,
          });
        });
      }
    }

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Upload file message (image, audio, document, etc.)
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { chatId, type } = req.body;
    const file = req.file;

    if (!chatId || !file || !type) {
      return res.status(400).json({
        success: false,
        message: "Please provide chatId, file, and type",
      });
    }

    // Check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is part of the chat
    if (!chat.users.includes(req.user?.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a unique filename
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = `/uploads/${filename}`;

    // Save file to uploads directory
    fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);

    // Create message
    const newMessage = await Message.create({
      sender: req.user?._id,
      content: filepath, // Path to the file
      chat: chatId,
      type,
      readBy: [req.user?._id], // Sender has read the message
    });

    // Populate message with sender info
    const message = await Message.findById(newMessage._id)
      .populate("sender", "name profilePicture")
      .populate("chat");

    if (!message) {
      return res.status(500).json({
        success: false,
        message: "Failed to create message",
      });
    }

    // Update chat's lastMessage
    await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

    // Emit socket event for real-time message delivery
    const io = req.app.get("io");
    if (io) {
      // Emit to chat room for real-time display
      io.to(chatId).emit("message-received", message);

      // Emit chat list update
      io.emit("chat-list-update", message);

      // Emit delivery confirmation to sender
      io.to(req.user?.id).emit("message-delivered", {
        messageId: message._id,
        chatId: chatId,
        userId: req.user?.id,
      });
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
