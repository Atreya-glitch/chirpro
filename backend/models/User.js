const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "bronze", "silver", "gold"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "active",
      },
      startDate: { type: Date },
      endDate: { type: Date },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    tweetCount: {
      type: Number,
      default: 0,
    },
    tweetCountResetDate: {
      type: Date,
      default: Date.now,
    },
    passwordReset: {
      lastRequestDate: { type: Date, default: null },
      token: { type: String, default: null },
      tokenExpiry: { type: Date, default: null },
    },
    notificationPreferences: {
      enabled: { type: Boolean, default: true },
      keywords: { type: [String], default: ["cricket", "science"] },
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getTweetLimit = function () {
  const limits = {
    free: 1,
    bronze: 3,
    silver: 5,
    gold: Infinity,
  };
  return limits[this.subscription.plan] || 1;
};

userSchema.methods.canPost = function () {
  const limit = this.getTweetLimit();
  if (limit === Infinity) return true;
  return this.tweetCount < limit;
};

userSchema.methods.canRequestPasswordReset = function () {
  if (!this.passwordReset.lastRequestDate) return true;
  const last = new Date(this.passwordReset.lastRequestDate);
  const now = new Date();
  return (
    last.getFullYear() !== now.getFullYear() ||
    last.getMonth() !== now.getMonth() ||
    last.getDate() !== now.getDate()
  );
};

module.exports = mongoose.model("User", userSchema);
