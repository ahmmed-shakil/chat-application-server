// routes/authRoutes.ts
import express, { type RequestHandler } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/authController";
import { protect } from "../middleware/auth";

const authRoutes = express.Router();

authRoutes.post("/register", register as RequestHandler);
authRoutes.post("/login", login as RequestHandler);
authRoutes.get(
  "/me",
  protect as RequestHandler,
  getCurrentUser as RequestHandler
);
authRoutes.post("/logout", protect as RequestHandler, logout as RequestHandler);

export default authRoutes;
