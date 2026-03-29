const express = require("express");
const Tweet = require("../models/Tweet");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Tweet content cannot be empty" });
    }

    if (content.length > 280) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Tweet cannot exceed 280 characters",
        });
    }

    const user = await User.findById(req.user._id);

    if (!user.canPost()) {
      const limit = user.getTweetLimit();
      const planName =
        user.subscription.plan.charAt(0).toUpperCase() +
        user.subscription.plan.slice(1);
      return res.status(403).json({
        success: false,
        message: `You've reached your tweet limit (${limit} tweets) for the ${planName} plan. Please upgrade your subscription to post more tweets.`,
        currentPlan: user.subscription.plan,
        tweetCount: user.tweetCount,
        tweetLimit: limit,
      });
    }

    const tweet = await Tweet.create({
      user: user._id,
      content: content.trim(),
    });

    user.tweetCount += 1;
    await user.save();

    const populatedTweet = await Tweet.findById(tweet._id).populate(
      "user",
      "name email subscription.plan",
    );

    res.status(201).json({
      success: true,
      tweet: populatedTweet,
      tweetCount: user.tweetCount,
      tweetLimit: user.getTweetLimit(),
      remainingTweets:
        user.getTweetLimit() === Infinity
          ? "Unlimited"
          : user.getTweetLimit() - user.tweetCount,
    });
  } catch (error) {
    console.error("Post tweet error:", error);
    res.status(500).json({ success: false, message: "Failed to post tweet" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tweets = await Tweet.find()
      .populate("user", "name email subscription.plan")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tweet.countDocuments();

    res.json({
      success: true,
      tweets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get tweets error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tweets" });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const tweets = await Tweet.find({ user: req.user._id })
      .populate("user", "name email subscription.plan")
      .sort({ createdAt: -1 });

    res.json({ success: true, tweets, count: tweets.length });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your tweets" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet)
      return res
        .status(404)
        .json({ success: false, message: "Tweet not found" });

    if (tweet.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this tweet",
        });
    }

    await tweet.deleteOne();

    await User.findByIdAndUpdate(req.user._id, { $inc: { tweetCount: -1 } });

    res.json({ success: true, message: "Tweet deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete tweet" });
  }
});

module.exports = router;
