const express = require("express");
const User = require("../models/User");
const { generateLetterPassword } = require("../utils/passwordGenerator");
const { sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

/**
 * POST /api/forgot-password/request
 * Accepts { identifier } — either an email address or phone number.
 * Rules:
 *  - Once per day limit (checked via passwordReset.lastRequestDate)
 *  - Generates a letters-only password
 *  - Sends the new password by email
 *  - Saves hashed new password to DB
 */
router.post("/request", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || identifier.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email address or phone number.",
      });
    }

    const trimmed = identifier.trim().toLowerCase();

    // Detect whether input looks like an email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[\d\s\+\-\(\)]{7,15}$/.test(identifier.trim());

    if (!isEmail && !isPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address or phone number.",
      });
    }

    // Find user by email or phone
    let user;
    if (isEmail) {
      user = await User.findOne({ email: trimmed });
    } else {
      // Normalize phone: strip all non-digit characters for comparison
      const digitsOnly = identifier.trim().replace(/\D/g, "");
      user = await User.findOne({
        phone: { $regex: digitsOnly.slice(-10) }, // match last 10 digits
      });
    }

    // Always respond with a generic success message even if user not found
    // This prevents user enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email/phone exists, a new password has been sent.",
      });
    }

    // ── Once-per-day limit check ──────────────────────────────────────────
    if (!user.canRequestPasswordReset()) {
      return res.status(429).json({
        success: false,
        tooManyRequests: true,
        message:
          "You can use this option only one time per day. Please try again tomorrow.",
      });
    }

    // ── Generate letters-only password ────────────────────────────────────
    const newPassword = generateLetterPassword(12);

    // ── Send email with new password ──────────────────────────────────────
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

    // ── Save new hashed password + update rate-limit date ─────────────────
    user.password = newPassword; // pre-save hook will hash it
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

/**
 * GET /api/forgot-password/check-limit
 * Lets the frontend check if the user has already used their reset today.
 * Accepts query param: ?identifier=<email or phone>
 */
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
