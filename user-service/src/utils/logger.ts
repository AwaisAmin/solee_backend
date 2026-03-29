import morgan from "morgan";

const isDev = process.env.NODE_ENV === "development";

export const httpLogger = morgan(isDev ? "dev" : "combined");

export const logger = {
  info: (msg: string) =>
    console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  error: (msg: string) =>
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`),
  warn: (msg: string) =>
    console.warn(`[${new Date().toISOString()}] WARN: ${msg}`),
};
