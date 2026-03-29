const express = require("express");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const {
  audioUploadWindow,
  isAudioWindowOpen,
} = require("../middleware/audioWindow");
const { upload } = require("../middleware/audioUpload");
const AudioTweet = require("../models/AudioTweet");
const AudioOtpSession = require("../models/AudioOtpSession");
const { sendAudioUploadOtpEmail } = require("../utils/email");

const router = express.Router();

const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const deleteFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (_) {}
};

router.get("/status", protect, (req, res) => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const period = h < 12 ? "AM" : "PM";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const currentIST = `${String(dh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period} IST`;

  res.json({
    success: true,
    windowOpen: isAudioWindowOpen(),
    currentIST,
    allowedWindow: "2:00 PM – 7:00 PM IST",
    rules: {
      maxDurationSeconds: 300,
      maxFileSizeMB: 100,
      allowedFormats: ["MP3", "WAV", "OGG", "AAC", "M4A", "WebM", "FLAC"],
    },
  });
});

router.post("/request-otp", protect, async (req, res) => {
  try {
    await AudioOtpSession.updateMany(
      { user: req.user._id, status: "pending" },
      { status: "expired" },
    );

    const otp = genOTP();
    const session = await AudioOtpSession.create({
      user: req.user._id,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const emailResult = await sendAudioUploadOtpEmail({
      userEmail: req.user.email,
      userName: req.user.name,
      otp,
    });

    res.json({
      success: true,
      otpSessionId: session._id,
      message: `An OTP has been sent to ${req.user.email.replace(/(.{2}).+(@.+)/, "$1***$2")}. It is valid for 10 minutes.`,
      emailSent: emailResult.success,
    });
  } catch (err) {
    console.error("Audio OTP request error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send OTP. Try again." });
  }
});

router.post("/verify-otp", protect, async (req, res) => {
  try {
    const { otpSessionId, otp } = req.body;

    if (!otpSessionId || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Session ID and OTP are required." });

    const session = await AudioOtpSession.findOne({
      _id: otpSessionId,
      user: req.user._id,
    });

    if (!session)
      return res
        .status(404)
        .json({
          success: false,
          message: "OTP session not found. Please request a new OTP.",
        });

    if (session.status === "expired" || new Date() > session.expiresAt) {
      session.status = "expired";
      await session.save();
      return res
        .status(410)
        .json({
          success: false,
          otpExpired: true,
          message: "OTP has expired. Please request a new one.",
        });
    }

    if (session.status === "verified")
      return res
        .status(400)
        .json({ success: false, message: "This OTP has already been used." });

    if (session.otp !== otp.trim())
      return res
        .status(401)
        .json({
          success: false,
          invalidOtp: true,
          message: "Incorrect OTP. Please try again.",
        });

    session.status = "verified";
    session.verifiedAt = new Date();
    await session.save();

    res.json({
      success: true,
      verified: true,
      otpSessionId: session._id,
      message: "OTP verified! You may now upload your audio tweet.",
    });
  } catch (err) {
    console.error("Audio OTP verify error:", err);
    res
      .status(500)
      .json({ success: false, message: "OTP verification failed." });
  }
});

router.post(
  "/upload",
  protect,
  audioUploadWindow,
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file received or file type not supported.",
      });
    }

    const filePath = req.file.path;

    try {
      const { otpSessionId, caption } = req.body;

      if (!otpSessionId) {
        deleteFile(filePath);
        return res
          .status(400)
          .json({ success: false, message: "OTP session ID is required." });
      }

      const otpSession = await AudioOtpSession.findOne({
        _id: otpSessionId,
        user: req.user._id,
        status: "verified",
      });

      if (!otpSession) {
        deleteFile(filePath);
        return res.status(403).json({
          success: false,
          otpRequired: true,
          message:
            "Invalid or unverified OTP session. Please complete OTP verification first.",
        });
      }

      let durationSeconds = 0;
      try {
        const mm = require("music-metadata");
        const metadata = await mm.parseFile(filePath, { duration: true });
        durationSeconds = metadata.format.duration || 0;
      } catch (parseErr) {
        console.warn("Could not parse audio metadata:", parseErr.message);

        deleteFile(filePath);
        return res.status(422).json({
          success: false,
          message:
            "Could not read audio file metadata. Please ensure the file is a valid audio format.",
        });
      }

      const MAX_DURATION = 300;
      if (durationSeconds > MAX_DURATION) {
        deleteFile(filePath);
        const mins = Math.floor(durationSeconds / 60);
        const secs = Math.round(durationSeconds % 60);
        return res.status(413).json({
          success: false,
          durationExceeded: true,
          message: `Audio is too long (${mins}m ${secs}s). Maximum allowed duration is 5 minutes (300 seconds).`,
          durationSeconds: Math.round(durationSeconds),
          maxDurationSeconds: MAX_DURATION,
        });
      }

      const MAX_SIZE = 100 * 1024 * 1024;
      if (req.file.size > MAX_SIZE) {
        deleteFile(filePath);
        return res.status(413).json({
          success: false,
          sizeExceeded: true,
          message: `File too large (${(req.file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 100 MB.`,
        });
      }

      otpSession.status = "expired";
      await otpSession.save();

      const audioTweet = await AudioTweet.create({
        user: req.user._id,
        caption: caption ? caption.trim().slice(0, 280) : "",
        audioFile: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: `/uploads/audio/${req.file.filename}`,
        },
        durationSeconds: Math.round(durationSeconds),
        otpSessionId: otpSessionId,
      });

      const populated = await AudioTweet.findById(audioTweet._id).populate(
        "user",
        "name email subscription.plan",
      );

      res.status(201).json({
        success: true,
        message: "Audio tweet posted successfully! 🎙️",
        audioTweet: {
          ...populated.toObject(),
          audioUrl: `${req.protocol}://${req.get("host")}${populated.audioFile.path}`,
        },
      });
    } catch (err) {
      console.error("Audio upload error:", err);
      deleteFile(filePath);
      res
        .status(500)
        .json({
          success: false,
          message: "Audio upload failed. Please try again.",
        });
    }
  },
);

router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const tweets = await AudioTweet.find()
      .populate("user", "name email subscription.plan")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const host = `${req.protocol}://${req.get("host")}`;
    const tweetsWithUrl = tweets.map((t) => ({
      ...t.toObject(),
      audioUrl: `${host}${t.audioFile.path}`,
    }));

    res.json({
      success: true,
      audioTweets: tweetsWithUrl,
      total: await AudioTweet.countDocuments(),
    });
  } catch (err) {
    console.error("Get audio tweets error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch audio tweets." });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const tweets = await AudioTweet.find({ user: req.user._id })
      .populate("user", "name email subscription.plan")
      .sort({ createdAt: -1 });

    const host = `${req.protocol}://${req.get("host")}`;
    res.json({
      success: true,
      audioTweets: tweets.map((t) => ({
        ...t.toObject(),
        audioUrl: `${host}${t.audioFile.path}`,
      })),
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your audio tweets." });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const tweet = await AudioTweet.findById(req.params.id);
    if (!tweet)
      return res
        .status(404)
        .json({ success: false, message: "Audio tweet not found." });

    if (tweet.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorised to delete this audio tweet.",
        });

    const fullPath = path.join(
      __dirname,
      "..",
      "uploads",
      "audio",
      tweet.audioFile.filename,
    );
    deleteFile(fullPath);

    await tweet.deleteOne();
    res.json({ success: true, message: "Audio tweet deleted." });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete audio tweet." });
  }
});

module.exports = router;
