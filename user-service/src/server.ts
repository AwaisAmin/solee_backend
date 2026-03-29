import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3001;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`User service running on port ${PORT}`);
  });
};

start();
