const express = require("express");
const User = require("../models/User");
const Tweet = require("../models/Tweet");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile
// Returns full profile data including notification preferences
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const tweetCount = await Tweet.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscription: user.subscription,
        tweetCount,
        tweetLimit: user.getTweetLimit(),
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/notifications
// Update notification preferences (enabled toggle + keywords list)
// Body: { enabled: boolean, keywords: string[] }
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/notifications", protect, async (req, res) => {
  try {
    const { enabled, keywords } = req.body;
    const update = {};

    if (typeof enabled === "boolean") {
      update["notificationPreferences.enabled"] = enabled;
    }

    if (Array.isArray(keywords)) {
      // Sanitise: lowercase, trim, remove empty, deduplicate, max 20 keywords
      const cleaned = [...new Set(
        keywords
          .map((k) => k.toString().trim().toLowerCase())
          .filter((k) => k.length > 0 && k.length <= 50)
      )].slice(0, 20);
      update["notificationPreferences.keywords"] = cleaned;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    ).select("notificationPreferences");

    res.json({
      success: true,
      message: "Notification preferences updated",
      notificationPreferences: user.notificationPreferences,
    });
  } catch (err) {
    console.error("Update notifications error:", err);
    res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
});

module.exports = router;
