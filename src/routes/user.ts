import express, { type RequestHandler } from "express";
import {
  searchUsers,
  getAllUsers,
  getUserById,
} from "../controllers/userController";
import { protect } from "../middleware/auth";

const userRoutes = express.Router();

// Protect all routes
userRoutes.use(protect as RequestHandler);

// Search users route
userRoutes.get("/search", searchUsers);

// Get all users route
userRoutes.get("/", getAllUsers);

// Get user by ID route
userRoutes.get("/:id", getUserById as RequestHandler);

export default userRoutes;
