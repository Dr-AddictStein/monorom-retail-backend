import express from "express";
import dotenv from "dotenv";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import siteDataRoutes from './routes/siteDataRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import pushNotificationRoutes from './routes/pushNotificationRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { sendBdBulkSms } from './services/smsService.js';






dotenv.config();

// creates express app
const app = express();

// use of middlewares
app.set("trust proxy", 1);

// Always allow the shop domains. Extra origins can be added via CORS_ORIGINS.
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "https://monorom-retail.netlify.app",
  "https://deliymug.com",
  "https://www.deliymug.com",
  "http://deliymug.com",
  "http://www.deliymug.com",
];

const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...extraOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    optionsSuccessStatus: 204,
  })
);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongooseInstance) => {
        console.log("Successfully Connected to DB");
        return mongooseInstance;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Monorom API is running" });
});

//file
app.use("/api/file",fileRoutes);

app.use("/api/seed",seedRoutes);

// user
app.use("/api/user", userRoutes);

// category
app.use("/api/category",categoryRoutes);

// product
app.use("/api/product",productRoutes);

// AI (SEO generation, etc.)
app.use("/api/ai", aiRoutes);

// cart
app.use("/api/cart",cartRoutes);

// order
app.use("/api/order",orderRoutes);

// siteData
app.use("/api/siteData",siteDataRoutes);

// blogs
app.use("/api/blog",blogRoutes);

// push notifications
app.use("/api/notifications", pushNotificationRoutes);

// Test Greenweb BD Bulk SMS (bdbulksms.net)
app.post("/api/test-sms", async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Both 'to' and 'message' fields are required",
      });
    }

    const providerPayload = await sendBdBulkSms(String(to).trim(), String(message));

    res.status(200).json({
      success: true,
      message: "SMS request completed (see provider for delivery status)",
      provider: providerPayload,
    });
  } catch (error) {
    console.error("BD Bulk SMS Error:", error);
    const status = error.status || (error.message?.includes("BDBULKSMS_TOKEN") ? 500 : 502);
    res.status(status).json({
      success: false,
      error: error.message || "Failed to send SMS",
      ...(error.provider != null ? { provider: error.provider } : {}),
    });
  }
});





// Local development only — Vercel runs this as a serverless function
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(process.env.PORT, () => {
        console.log(`Listening on PORT ${process.env.PORT}`);
      });
    })
    .catch((error) => {
      console.log(error);
    });
}

export default app;
