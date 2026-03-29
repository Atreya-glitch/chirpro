const mongoose = require("mongoose");

const audioTweetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      maxlength: [280, "Caption cannot exceed 280 characters"],
      trim: true,
      default: "",
    },

    audioFile: {
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      path: { type: String, required: true },
    },

    durationSeconds: { type: Number, required: true },

    otpSessionId: { type: String, required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    uploadedInWindow: { type: String, default: "14:00–19:00 IST" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AudioTweet", audioTweetSchema);
