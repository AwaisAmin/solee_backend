import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { httpLogger } from "./utils/logger";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(httpLogger);

// Routes
app.use("/api/v1/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

// Error handler
app.use(errorMiddleware);

export default app;
