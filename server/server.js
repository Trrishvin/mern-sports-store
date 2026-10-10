import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import healthRouter from "./routes/health.js";
import ordersRouter from "./routes/orders.js";
import productsRouter from "./routes/products.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use((error, _req, res, _next) => {
  console.error("API request failed:", error);
  const isInvalidJson = error instanceof SyntaxError && error.status === 400;
  const isValidationError =
    error.name === "ValidationError" || error.name === "CastError";
  const isDuplicateError = error.code === 11000;
  const status = isInvalidJson || isValidationError
    ? 400
    : isDuplicateError
      ? 409
      : 500;
  return res.status(status).json({
    success: false,
    data: null,
    message: isInvalidJson
      ? "Request body must be valid JSON"
      : isValidationError
        ? error.message
        : isDuplicateError
          ? "A record with that value already exists"
          : "Internal server error",
  });
});

try {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to server/.env.");
  }

  await connectDB();
} catch (error) {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
}

// On Vercel the default export handles requests directly; only bind a
// port for local development.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
