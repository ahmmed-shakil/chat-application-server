// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Server, Socket } from "socket.io";
// import jwt from "jsonwebtoken";
// import User from "../models/User";
// import Chat from "../models/Chat";

// interface JwtPayload {
//   userId: string;
// }

// export const setupSocketHandlers = (io: Server) => {
//   // Map to store active users and their socket IDs
//   const activeUsers = new Map();

//   io.on("connection", async (socket: Socket) => {
//     console.log("New client connected: ", socket.id);

//     // Add user to active users when they come online
//     socket.on("setup", async (token) => {
//       try {
//         // Verify token and get user ID
//         const decoded = jwt.verify(
//           token,
//           process.env.JWT_SECRET || "fallback_secret"
//         ) as JwtPayload;

//         const userId = decoded.userId;

//         // Add user to active users map
//         activeUsers.set(userId, socket.id);

//         // Join a room with the user's ID
//         socket.join(userId);

//         // Update user status in DB
//         await User.findByIdAndUpdate(userId, {
//           isOnline: true,
//           lastSeen: new Date(),
//         });

//         // Emit online status to other users
//         socket.broadcast.emit("user-online", userId);

//         console.log("User online: ", userId);
//       } catch (error) {
//         console.error("Socket setup error:", error);
//       }
//     });

//     // Handle joining a chat
//     socket.on("join-chat", (chatId) => {
//       socket.join(chatId);
//       console.log(`User joined chat: ${chatId}`);
//     });

//     // Handle new message
//     socket.on("new-message", (message) => {
//       const chat = message.chat;

//       if (!chat.users) {
//         console.log("Chat users not defined");
//         return;
//       }

//       // Send to all users in the chat except the sender
//       chat.users.forEach((user: any) => {
//         if (user._id === message.sender._id) return;

//         // Send to user's room
//         io.to(activeUsers.get(user._id)).emit("message-received", message);
//       });
//     });

//     // Handle typing indicator
//     socket.on("typing", (chatId, userId) => {
//       socket.to(chatId).emit("typing", chatId, userId);
//     });

//     // Handle stop typing indicator
//     socket.on("stop-typing", (chatId) => {
//       socket.to(chatId).emit("stop-typing", chatId);
//     });

//     // Handle when user reads a message
//     socket.on("message-read", async (messageId, userId) => {
//       io.emit("message-read-update", messageId, userId);
//     });

//     // Handle user disconnect
//     socket.on("disconnect", async () => {
//       console.log("Client disconnected: ", socket.id);

//       // Find user by socket ID and remove from active users
//       for (const [userId, socketId] of activeUsers.entries()) {
//         if (socketId === socket.id) {
//           activeUsers.delete(userId);

//           // Update user status in DB
//           await User.findByIdAndUpdate(userId, {
//             isOnline: false,
//             lastSeen: new Date(),
//           });

//           // Emit offline status to other users
//           socket.broadcast.emit("user-offline", userId);

//           console.log("User offline: ", userId);
//           break;
//         }
//       }
//     });
//   });
// };
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Chat from "../models/Chat";

interface JwtPayload {
  userId: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Map to store active users and their socket IDs
  const activeUsers = new Map();

  io.on("connection", async (socket: Socket) => {
    console.log("🚀 ~ io.on ~ socket:", socket);
    console.log("New client connected: ", socket.id);

    // Add user to active users when they come online
    socket.on("setup", async (token) => {
      try {
        // Verify token and get user ID
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback_secret"
        ) as JwtPayload;

        const userId = decoded.userId;

        // Add user to active users map
        activeUsers.set(userId, socket.id);

        // Join a room with the user's ID
        socket.join(userId);

        // Update user status in DB
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // Emit online status to other users
        socket.broadcast.emit("user-online", userId);

        // Send a list of currently online users to this user
        const onlineUserIds = Array.from(activeUsers.keys());
        socket.emit("online-users", onlineUserIds);

        console.log("User online: ", userId, "Socket ID:", socket.id);
        console.log("Current active users:", Array.from(activeUsers.entries()));
      } catch (error) {
        console.error("Socket setup error:", error);
      }
    });

    // Handle joining a chat
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Handle leaving a chat
    socket.on("leave-chat", (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });

    // Handle new message
    // socket.on("new-message", (message) => {
    //   const chat = message.chat;

    //   if (!chat || !chat.users) {
    //     console.log("Chat or chat users not defined in the message:", message);
    //     return;
    //   }

    //   console.log(
    //     "New message received from client. Broadcasting to recipients in chat:",
    //     chat._id
    //   );

    //   // Send to all users in the chat except the sender
    //   chat.users.forEach((user: any) => {
    //     // Skip sending to the sender
    //     if (user === message.sender._id) return;

    //     const recipientSocketId = activeUsers.get(user);
    //     console.log(
    //       "🚀 ~ chat.users.forEach ~ recipientSocketId:",
    //       recipientSocketId
    //     );

    //     if (recipientSocketId) {
    //       console.log(
    //         `Sending message to user ${user} via socket ID ${recipientSocketId}`
    //       );

    //       // Send the message to the chat room for real-time display
    //       io.to(chat._id).emit("message-received", message);

    //       // Send directly to the user's socket ID
    //       io.to(recipientSocketId).emit("message-received", message);

    //       // Also send to the user's room (userId) for redundancy
    //       io.to(user).emit("message-received", message);

    //       // And to the chat room if they're in it
    //       io.to(chat).emit("message-received", message);
    //     } else {
    //       console.log(
    //         `User ${user} is not online, cannot deliver message immediately`
    //       );
    //     }
    //   });
    // });
    socket.on("new-message", (message) => {
      const chat = message.chat;

      if (!chat || !chat.users) {
        console.log("Chat or chat users not defined in the message:", message);
        return;
      }

      console.log(
        "New message received from client. Broadcasting to recipients in chat:",
        chat._id
      );

      // Send the message to the chat room for real-time display
      io.to(chat._id).emit("message-received", message);

      // Also emit a separate event for chat list updates
      // This will be used to update the chat list without interfering with message display
      io.emit("chat-list-update", message);

      // Send to all users in the chat except the sender
      chat.users.forEach((user: any) => {
        // Skip sending to the sender
        if (user === message.sender._id) return;

        const recipientSocketId = activeUsers.get(user);

        if (recipientSocketId) {
          console.log(
            `Sending message to user ${user} via socket ID ${recipientSocketId}`
          );

          // Send notifications directly to the user's socket ID
          io.to(recipientSocketId).emit("message-notification", message);

          // Also send to the user's room (userId) for redundancy
          io.to(user).emit("message-notification", message);
        } else {
          console.log(
            `User ${user} is not online, cannot deliver message immediately`
          );
        }
      });
    });

    // Handle typing indicator
    socket.on("typing", (chatId, userId) => {
      // console.log(`User ${userId} is typing in chat ${chatId}`);
      socket.to(chatId).emit("typing", chatId, userId);
    });

    // Handle stop typing indicator
    socket.on("stop-typing", (chatId) => {
      // console.log(`User stopped typing in chat ${chatId}`);
      socket.to(chatId).emit("stop-typing", chatId);
    });

    // Handle when user reads a message
    socket.on("message-read", async (messageId, userId) => {
      // console.log(`Message ${messageId} marked as read by user ${userId}`);
      io.emit("message-read-update", messageId, userId);
    });

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected: ", socket.id);

      // Find user by socket ID and remove from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);

          // Update user status in DB
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Emit offline status to other users
          socket.broadcast.emit("user-offline", userId);

          console.log("User offline: ", userId);
          break;
        }
      }
    });
  });

  // Debug utility - log active users count periodically
  setInterval(() => {
    console.log("Active users count:", activeUsers.size);
    if (activeUsers.size > 0) {
      console.log("Active users:", Array.from(activeUsers.keys()));
    }
  }, 60000); // Log every minute
};
