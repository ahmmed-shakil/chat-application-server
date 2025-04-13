import mongoose, { Schema, Document } from "mongoose";
import type { IUser } from "./User";
import type { IChat } from "./Chat";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  AUDIO = "audio",
  FILE = "file",
  VIDEO = "video",
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId | IUser;
  content: string;
  chat: mongoose.Types.ObjectId | IChat;
  type: MessageType;
  readBy: (mongoose.Types.ObjectId | IUser)[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
