const mongoose = require("mongoose");

const audioTweetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Caption/title for the audio tweet (optional)
    caption: {
      type: String,
      maxlength: [280, "Caption cannot exceed 280 characters"],
      trim: true,
      default: "",
    },

    // Stored file info
    audioFile: {
      filename:     { type: String, required: true },  // UUID-based filename on disk
      originalName: { type: String, required: true },  // Original upload name
      mimetype:     { type: String, required: true },  // audio/mpeg, audio/wav, etc.
      size:         { type: Number, required: true },  // bytes
      path:         { type: String, required: true },  // relative path served statically
    },

    // Validated audio metadata
    durationSeconds: { type: Number, required: true },  // must be <= 300 (5 min)

    // OTP verification record – the OTP session used to authorise this upload
    otpSessionId: { type: String, required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // IST upload time window when this was accepted
    uploadedInWindow: { type: String, default: "14:00–19:00 IST" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AudioTweet", audioTweetSchema);
