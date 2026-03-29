const express = require("express");
const User = require("../models/User");
const { generateLetterPassword } = require("../utils/passwordGenerator");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

router.post("/request", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || identifier.trim() === "") {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your registered email address or phone number.",
      });
    }

    const trimmed = identifier.trim().toLowerCase();

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[\d\s\+\-\(\)]{7,15}$/.test(identifier.trim());

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address or phone number.",
      });
    }

    let user;
    if (isEmail) {
      user = await User.findOne({ email: trimmed });
    } else {
      const digitsOnly = identifier.trim().replace(/\D/g, "");
      user = await User.findOne({
        phone: { $regex: digitsOnly.slice(-10) },
      });
    }

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email/phone exists, a new password has been sent.",
      });
    }

    if (!user.canRequestPasswordReset()) {
      return res.status(429).json({
        success: false,
        tooManyRequests: true,
        message:
          "You can use this option only one time per day. Please try again tomorrow.",
      });
    }

    const newPassword = generateLetterPassword(12);

    const emailResult = await sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.name,
      newPassword,
    });

    if (!emailResult.success) {
      console.error("Failed to send reset email:", emailResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }

    user.password = newPassword;
    user.passwordReset.lastRequestDate = new Date();
    user.passwordReset.token = null;
    user.passwordReset.tokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "A new password has been sent to your registered email address. Please check your inbox.",
      emailSent: true,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
});

router.get("/check-limit", async (req, res) => {
  try {
    const { identifier } = req.query;
    if (!identifier) return res.json({ canRequest: true });

    const trimmed = identifier.trim().toLowerCase();
    const user = await User.findOne({ email: trimmed });

    if (!user) return res.json({ canRequest: true });

    const canRequest = user.canRequestPasswordReset();
    res.json({ canRequest });
  } catch {
    res.json({ canRequest: true });
  }
});

module.exports = router;
