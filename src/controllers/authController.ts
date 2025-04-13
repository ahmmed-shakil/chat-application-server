/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Helper function to create JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

// Register a new user
const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random&color=fff`,
    });

    // Generate token
    const token = generateToken(user.id);

    // Send welcome email
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to WhatsApp Clone",
        html: `
          <h1>Welcome to WhatsApp Clone, ${name}!</h1>
          <p>Thank you for registering with us. Enjoy messaging with your friends and family!</p>
        `,
      });
    } catch (error) {
      console.error("Email sending error:", error);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Login user
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("🚀 ~ login ~ email:", email);

    // Check if user exists
    const user = await User.findOne({ email });
    console.log("🚀 ~ login ~ user:", user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log("🚀 ~ login ~ isMatch:", isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          status: user.status,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Get current user
const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select("-password");

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

// Logout user
const logout = async (req: Request, res: Response) => {
  try {
    // Update user status
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

export { register, login, logout, getCurrentUser };
