const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendOtpEmail } = require("../utils/email");

const router = express.Router();

const OTP_EXPIRY = 10 * 60 * 1000; 

const LANGUAGE_MAP = {
  English: "en",
  Spanish: "es",
  French: "fr",
  Hindi: "hi",
  Portuguese: "pt",
  Chinese: "zh",
};

const otpSessions = new Map();

router.post("/request-otp", protect, async (req, res) => {
  try {
    const { language } = req.body;

    if (!LANGUAGE_MAP[language]) {
      return res.status(400).json({ success: false, message: "Unsupported language" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = Math.random().toString(36).substr(2, 9);
    const useEmail = language === "French";

    otpSessions.set(sessionId, {
      userId: req.user._id.toString(),
      otp,
      language,
      expiresAt: Date.now() + OTP_EXPIRY,
    });

    if (useEmail) {
      await sendOtpEmail({
        userEmail: req.user.email,
        userName: req.user.name,
        otp,
        browser: "Security Verification",
        device: "Account Settings",
        ipAddress: req.ip,
      });
    } else {
      console.log(`[SMS SIMULATION] To: ${req.user.phone}, OTP: ${otp} (Required for ${language} switch)`);
    }

    res.json({
      success: true,
      sessionId,
      method: useEmail ? "email" : "mobile",
      target: useEmail ? req.user.email : req.user.phone,
      message: `A verification code has been sent to your ${useEmail ? "email" : "mobile"}.`,
      simulatedOtp: useEmail ? null : otp, 
    });
  } catch (error) {
    console.error("Language OTP request error:", error);
    res.status(500).json({ success: false, message: "Failed to send verification code" });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    const session = otpSessions.get(sessionId);

    if (!session) {
      return res.status(400).json({ success: false, message: "Invalid or expired session" });
    }

    if (Date.now() > session.expiresAt) {
      otpSessions.delete(sessionId);
      return res.status(400).json({ success: false, message: "Verification code expired" });
    }

    if (session.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect verification code" });
    }

    if (session.userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorised session" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { language: session.language } },
      { new: true }
    );

    otpSessions.delete(sessionId);

    res.json({
      success: true,
      message: `Language successfully updated to ${session.language}!`,
      language: user.language,
    });
  } catch (error) {
    console.error("Language verification error:", error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

module.exports = router;
