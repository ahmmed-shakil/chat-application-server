/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Response } from "express";
import User from "../models/User";

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { search = "" } = req.query;
    const keyword = search
      ? {
          $or: [
            { name: { $regex: search as string, $options: "i" } },
            { email: { $regex: search as string, $options: "i" } },
          ],
        }
      : {};

    // Find users excluding the current user
    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user?._id },
    }).select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Find all users excluding the current user
    const users = await User.find({ _id: { $ne: req.user?._id } }).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
