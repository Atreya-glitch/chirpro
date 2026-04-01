require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payment");
const tweetRoutes = require("./routes/tweets");
const forgotPasswordRoutes = require("./routes/forgotPassword");
const audioTweetRoutes = require("./routes/audioTweets");
const profileRoutes = require("./routes/profile");
const languageRoutes = require("./routes/language");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/tweets", tweetRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/audio-tweets", audioTweetRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/language", languageRoutes);

app.get("/api/health", (req, res) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const istHours = istTime.getUTCHours();

  res.json({
    status: "OK",
    message: "TweetApp API is running",
    timestamp: new Date().toISOString(),
    ist: istTime.toUTCString().replace("GMT", "IST"),
    paymentWindow: {
      open: istHours >= 10 && istHours < 11,
      window: "10:00 AM – 11:00 AM IST",
    },
    audioUploadWindow: {
      open: istHours >= 14 && istHours < 19,
      window: "2:00 PM – 7:00 PM IST",
    },
  });
});

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      sizeExceeded: true,
      message: "File too large. Maximum allowed audio size is 100 MB.",
    });
  }
  if (err.message && err.message.startsWith("Unsupported audio format")) {
    return res.status(415).json({ success: false, message: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.path} not found` });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed:", err.message);
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("✅ In-memory MongoDB connected at", uri);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`💳 Payment window:       10:00 AM – 11:00 AM IST`);
    console.log(`🎙️  Audio upload window:   2:00 PM –  7:00 PM IST`);
    console.log(`🔔 Notification prefs:   GET/PATCH /api/profile`);
  });
};

startServer();

module.exports = app;
