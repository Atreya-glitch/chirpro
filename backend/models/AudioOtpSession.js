const mongoose = require("mongoose");

const audioOtpSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "expired"],
      default: "pending",
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

audioOtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AudioOtpSession", audioOtpSessionSchema);
