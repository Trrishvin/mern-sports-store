import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Name, a valid email, and a password of at least 8 characters are required",
    });
  }

  try {
    const user = await User.create({ name, email, password });
    return res.status(201).json({
      success: true,
      data: { user: userResponse(user), token: createToken(user) },
      message: "Account registered successfully",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "An account with this email already exists",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.message,
      });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      "+password",
    );
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      data: { user: userResponse(user), token: createToken(user) },
      message: "Login successful",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
