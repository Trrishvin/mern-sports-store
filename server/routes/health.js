import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    data: {
      status: databaseConnected ? "ok" : "unavailable",
      database: databaseConnected ? "connected" : "disconnected",
      ...(databaseConnected ? {} : { error: req.app.locals.dbError || "not connected yet" }),
    },
    message: databaseConnected
      ? "API and database are healthy"
      : "Database is not connected",
  });
});

export default router;
