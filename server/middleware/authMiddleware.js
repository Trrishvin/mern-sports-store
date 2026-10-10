import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Authentication token is required",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Invalid or expired token",
      });
    }
    return next(error);
  }
}
