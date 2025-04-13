/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import Chat from "../models/Chat";
import User from "../models/User";
import mongoose from "mongoose";

// Create or access one-on-one chat
// export const accessChat = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.body;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "userId param not sent with request",
//       });
//     }

//     // Check if chat already exists
//     const chat = await Chat.findOne({
//       isGroupChat: false,
//       users: {
//         $all: [req.user?._id, userId],
//         $size: 2,
//       },
//     })
//       .populate("users", "-password")
//       .populate("lastMessage");

//     // If chat exists, return it
//     if (chat) {
//       return res.status(200).json({
//         success: true,
//         data: chat,
//       });
//     }

//     // If chat doesn't exist, create it
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Create chat name from user names
//     const chatName = `${req.user?.name}, ${user.name}`;

//     const newChat = await Chat.create({
//       name: chatName,
//       isGroupChat: false,
//       users: [req.user?._id, userId],
//     });

//     const fullChat = await Chat.findById(newChat._id).populate(
//       "users",
//       "-password"
//     );

//     res.status(201).json({
//       success: true,
//       data: fullChat,
//     });
//   } catch (error: any) {
//     console.log("🚀 ~ accessChat ~ error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Server Error",
//     });
//   }
// };
export const accessChat = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const loggedInUserId = req.user?._id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId param not sent with request",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find existing one-on-one chat
    // const existingChat = await Chat.findOneOnOneChat(loggedInUserId, userId)
    //   .populate("users", "-password")
    //   .populate("lastMessage");
    const existingChat = await Chat.findOneOnOneChat(loggedInUserId, userId);

    if (existingChat) {
      await existingChat.populate("users", "-password");
      await existingChat.populate("lastMessage");
    }

    if (existingChat) {
      return res.status(200).json({
        success: true,
        data: existingChat,
      });
    }

    // Create chat name
    const chatName = `${req.user?.name}, ${user.name}`;

    // Create new chat
    const newChat = await Chat.create({
      name: chatName,
      isGroupChat: false,
      users: [loggedInUserId, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "users",
      "-password"
    );

    res.status(201).json({
      success: true,
      data: fullChat,
    });
  } catch (error: any) {
    console.error("🚀 ~ accessChat ~ error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get all chats for a user
export const getUserChats = async (req: Request, res: Response) => {
  try {
    // Find all chats where the user is a participant
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user?._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }); // Sort by latest

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Create group chat
export const createGroupChat = async (req: Request, res: Response) => {
  try {
    const { name, users } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Parse users if it's a string
    let parsedUsers = users;
    if (typeof users === "string") {
      parsedUsers = JSON.parse(users);
    }

    // Check if there are at least 2 users
    if (parsedUsers.length < 2) {
      return res.status(400).json({
        success: false,
        message: "A group chat requires at least 3 users (including you)",
      });
    }

    // Add current user to group
    parsedUsers.push(req.user?._id);

    // Create group chat
    const groupChat = await Chat.create({
      name,
      isGroupChat: true,
      users: parsedUsers,
      groupAdmin: req.user?._id,
      groupPicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random&color=fff`,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json({
      success: true,
      data: fullGroupChat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Update group chat
export const updateGroupChat = async (req: Request, res: Response) => {
  try {
    const { chatId, name, users } = req.body;

    // Parse users if it's a string
    let parsedUsers;
    if (users) {
      parsedUsers = typeof users === "string" ? JSON.parse(users) : users;
    }

    // Find the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if the requester is the admin
    if (chat.groupAdmin?.toString() !== req.user?.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the group admin can update the group",
      });
    }

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        name: name || chat.name,
        users: parsedUsers || chat.users,
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({
      success: true,
      data: updatedChat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Add user to group
export const addToGroup = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    // Find the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if the requester is the admin
    if (chat.groupAdmin?.toString() !== req.user?.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the group admin can add users",
      });
    }

    // Check if user is already in the group
    // if (chat.users.includes(new mongoose.Types.ObjectId(userId))) {
    if (chat.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User already in the group",
      });
    }

    // Add user to group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({
      success: true,
      data: updatedChat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Remove user from group
export const removeFromGroup = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    // Find the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if the requester is the admin or the user is removing themselves
    if (
      chat.groupAdmin?.toString() !== req.user?.id.toString() &&
      userId !== req.user?.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Remove user from group
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({
      success: true,
      data: updatedChat,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
