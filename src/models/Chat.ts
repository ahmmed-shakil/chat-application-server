// import mongoose, { Schema, Document } from "mongoose";
// import type { IUser } from "./User";

// export interface IChat extends Document {
//   name: string;
//   isGroupChat: boolean;
//   users: mongoose.Types.ObjectId[] | IUser[];
//   lastMessage?: mongoose.Types.ObjectId;
//   groupAdmin?: mongoose.Types.ObjectId | IUser;
//   groupPicture?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const ChatSchema: Schema = new Schema(
//   {
//     name: {
//       type: String,
//       trim: true,
//       required: [true, "Chat name is required"],
//     },
//     isGroupChat: {
//       type: Boolean,
//       default: false,
//     },
//     users: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],
//     lastMessage: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Message",
//     },
//     groupAdmin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     groupPicture: {
//       type: String,
//       default: "https://ui-avatars.com/api/?background=random",
//     },
//   },
//   { timestamps: true }
// );

// // Add this to your Chat model
// ChatSchema.statics.findOneOnOneChat = async function (userIdA, userIdB) {
//   return this.findOne({
//     isGroupChat: false,
//     users: {
//       $all: [userIdA, userIdB],
//       $size: 2,
//     },
//   });
// };
// // For one-on-one chats, ensure unique pairs of users
// // ChatSchema.index(
// //   { users: 1, isGroupChat: 1 },
// //   { unique: true, partialFilterExpression: { isGroupChat: false } }
// // );

// export default mongoose.model<IChat>("Chat", ChatSchema);

import mongoose, { Schema, Document, Model } from "mongoose";
import type { IUser } from "./User";

export interface IChat extends Document {
  name: string;
  isGroupChat: boolean;
  users: mongoose.Types.ObjectId[] | IUser[];
  lastMessage?: mongoose.Types.ObjectId;
  groupAdmin?: mongoose.Types.ObjectId | IUser;
  groupPicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define a new interface for the model statics
interface ChatModel extends Model<IChat> {
  findOneOnOneChat(userIdA: string, userIdB: string): Promise<IChat | null>;
}

const ChatSchema: Schema<IChat> = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Chat name is required"],
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupPicture: {
      type: String,
      default: "https://ui-avatars.com/api/?background=random",
    },
  },
  { timestamps: true }
);

// Define the static method properly
ChatSchema.statics.findOneOnOneChat = async function (userIdA, userIdB) {
  return this.findOne({
    isGroupChat: false,
    users: {
      $all: [userIdA, userIdB],
      $size: 2,
    },
  });
};

// Export model using the ChatModel interface
export default mongoose.model<IChat, ChatModel>("Chat", ChatSchema);
