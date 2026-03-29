const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginSession = require("../models/LoginSession");
const { protect } = require("../middleware/auth");
const {
  parseUserAgent,
  isMobileLoginWindowOpen,
  getClientIP,
} = require("../utils/uaParser");
const { sendOtpEmail } = require("../utils/email");

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (await User.findOne({ email }))
      return res
        .status(400)
        .json({ message: "User already exists with this email" });

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || undefined,
      subscription: { plan: "free", status: "active" },
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        tweetCount: user.tweetCount,
        tweetLimit: user.getTweetLimit(),
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  const ua = req.headers["user-agent"] || "";
  const ip = getClientIP(req);
  const { browser, browserFamily, os, device, deviceCategory } =
    parseUserAgent(ua);

  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      await LoginSession.create({
        user: user?._id || new (require("mongoose").Types.ObjectId)(),
        browser,
        browserFamily,
        os,
        device,
        deviceCategory,
        ipAddress: ip,
        userAgent: ua,
        status: "failed",
      }).catch(() => {});
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (deviceCategory === "mobile" && !isMobileLoginWindowOpen()) {
      const session = await LoginSession.create({
        user: user._id,
        browser,
        browserFamily,
        os,
        device,
        deviceCategory,
        ipAddress: ip,
        userAgent: ua,
        status: "blocked_mobile",
      });

      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const currentIST = `${ist.getUTCHours().toString().padStart(2, "0")}:${ist.getUTCMinutes().toString().padStart(2, "0")} IST`;

      return res.status(403).json({
        success: false,
        blockedMobile: true,
        message:
          "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
        currentIST,
        allowedWindow: "10:00 AM – 1:00 PM IST",
        sessionId: session._id,
      });
    }

    if (browserFamily === "chrome") {
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const session = await LoginSession.create({
        user: user._id,
        browser,
        browserFamily,
        os,
        device,
        deviceCategory,
        ipAddress: ip,
        userAgent: ua,
        status: "otp_pending",
        otp,
        otpExpiry,
      });

      sendOtpEmail({
        userEmail: user.email,
        userName: user.name,
        otp,
        ipAddress: ip,
        browser,
        device,
      }).catch(console.error);

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        sessionId: session._id,
        message: `An OTP has been sent to ${user.email}. Please verify to complete login.`,
        email: user.email.replace(/(.{2}).+(@.+)/, "$1***$2"),
      });
    }

    const isMicrosoft = browserFamily === "edge" || browserFamily === "ie";

    const session = await LoginSession.create({
      user: user._id,
      browser,
      browserFamily,
      os,
      device,
      deviceCategory,
      ipAddress: ip,
      userAgent: ua,
      status: "success",
    });

    return res.json({
      success: true,
      directLogin: true,
      microsoftBrowser: isMicrosoft,
      message: isMicrosoft
        ? "Logged in via Microsoft browser — no additional verification required."
        : "Logged in successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        tweetCount: user.tweetCount,
        tweetLimit: user.getTweetLimit(),
      },
      token: generateToken(user._id),
      sessionInfo: { browser, os, device, ip, sessionId: session._id },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp)
      return res
        .status(400)
        .json({ message: "Session ID and OTP are required" });

    const session = await LoginSession.findById(sessionId).populate("user");
    if (!session)
      return res
        .status(404)
        .json({ message: "Session not found. Please log in again." });

    if (session.status !== "otp_pending")
      return res
        .status(400)
        .json({ message: "This session is not awaiting OTP verification." });

    if (new Date() > session.otpExpiry)
      return res
        .status(410)
        .json({
          otpExpired: true,
          message: "OTP has expired. Please log in again.",
        });

    if (session.otp !== otp.trim())
      return res
        .status(401)
        .json({
          invalidOtp: true,
          message: "Incorrect OTP. Please try again.",
        });

    session.status = "otp_verified";
    session.otpVerifiedAt = new Date();
    session.otp = null;
    await session.save();

    const user = session.user;

    return res.json({
      success: true,
      message: "OTP verified successfully. Welcome!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        tweetCount: user.tweetCount,
        tweetLimit: user.getTweetLimit(),
      },
      token: generateToken(user._id),
      sessionInfo: {
        browser: session.browser,
        os: session.os,
        device: session.device,
        ip: session.ipAddress,
        sessionId: session._id,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await LoginSession.findById(sessionId).populate("user");

    if (!session || session.status !== "otp_pending")
      return res
        .status(400)
        .json({ message: "Invalid session for OTP resend." });

    const newOtp = generateOTP();
    session.otp = newOtp;
    session.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await session.save();

    await sendOtpEmail({
      userEmail: session.user.email,
      userName: session.user.name,
      otp: newOtp,
      ipAddress: session.ipAddress,
      browser: session.browser,
      device: session.device,
    });

    return res.json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP." });
  }
});

router.get("/me", protect, async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      subscription: user.subscription,
      tweetCount: user.tweetCount,
      tweetLimit: user.getTweetLimit(),
      canPost: user.canPost(),
      notificationPreferences: user.notificationPreferences,
    },
  });
});

router.get("/login-history", protect, async (req, res) => {
  try {
    const sessions = await LoginSession.find({ user: req.user._id })
      .sort({ loginAt: -1 })
      .limit(20)
      .select("-otp -userAgent");

    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Login history error:", error);
    res.status(500).json({ message: "Failed to fetch login history" });
  }
});

module.exports = router;
