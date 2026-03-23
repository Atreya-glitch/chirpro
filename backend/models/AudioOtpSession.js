const mongoose = require("mongoose");

/**
 * Short-lived OTP session for authorising a single audio upload.
 * Created when the user requests an audio-upload OTP.
 * Consumed (status → "used") once the upload is verified.
 */
const audioOtpSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    otp: { type: String, required: true },          // 6-digit plain code
    expiresAt: { type: Date, required: true },       // 10 minutes from creation
    status: {
      type: String,
      enum: ["pending", "verified", "expired"],
      default: "pending",
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL index — MongoDB will auto-delete documents 10 min after expiresAt
audioOtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AudioOtpSession", audioOtpSessionSchema);
