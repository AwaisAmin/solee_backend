import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI as string;

  await mongoose.connect(uri);
  logger.info("MongoDB connected");
};

export default connectDB;
