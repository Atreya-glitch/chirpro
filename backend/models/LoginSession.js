const mongoose = require("mongoose");

const loginSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Device & browser info
    browser: { type: String, default: "Unknown" },
    browserFamily: { type: String, default: "other" }, // chrome | edge | ie | firefox | safari | other
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
    deviceCategory: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    ipAddress: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "" },

    // Auth outcome
    status: {
      type: String,
      enum: [
        "success",         // Normal login
        "otp_pending",     // Chrome — OTP sent, not yet verified
        "otp_verified",    // Chrome — OTP verified, login complete
        "blocked_mobile",  // Mobile outside time window
        "failed",          // Wrong credentials
      ],
      default: "success",
    },

    // OTP fields (Chrome users)
    otp: { type: String, default: null },        // 6-digit code (stored plain for demo; hash in prod)
    otpExpiry: { type: Date, default: null },
    otpVerifiedAt: { type: Date, default: null },

    loginAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model("LoginSession", loginSessionSchema);
