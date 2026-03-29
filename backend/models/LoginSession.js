const mongoose = require("mongoose");

const loginSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    browser: { type: String, default: "Unknown" },
    browserFamily: { type: String, default: "other" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown" },
    deviceCategory: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
    ipAddress: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "success",
        "otp_pending",
        "otp_verified",
        "blocked_mobile",
        "failed",
      ],
      default: "success",
    },

    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    otpVerifiedAt: { type: Date, default: null },

    loginAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

module.exports = mongoose.model("LoginSession", loginSessionSchema);
