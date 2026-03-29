const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { paymentTimeWindow } = require("../middleware/paymentWindow");
const { sendSubscriptionInvoice } = require("../utils/email");

const router = express.Router();

const PLANS = {
  bronze: { name: "Bronze Plan", amount: 100, tweets: 3 },
  silver: { name: "Silver Plan", amount: 300, tweets: 5 },
  gold: { name: "Gold Plan", amount: 1000, tweets: "Unlimited" },
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    plans: [
      { id: "free", name: "Free Plan", price: 0, tweets: 1, currency: "INR" },
      {
        id: "bronze",
        name: "Bronze Plan",
        price: 100,
        tweets: 3,
        currency: "INR",
      },
      {
        id: "silver",
        name: "Silver Plan",
        price: 300,
        tweets: 5,
        currency: "INR",
      },
      {
        id: "gold",
        name: "Gold Plan",
        price: 1000,
        tweets: "Unlimited",
        currency: "INR",
      },
    ],
    paymentWindow: {
      start: "10:00 AM IST",
      end: "11:00 AM IST",
      note: "Payments are only accepted between 10:00 AM and 11:00 AM IST",
    },
  });
});

router.post("/create-order", protect, paymentTimeWindow, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan selected" });
    }

    const planDetails = PLANS[plan];
    const amountInPaise = planDetails.amount * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        plan: plan,
        userName: req.user.name,
        userEmail: req.user.email,
      },
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: plan,
        planName: planDetails.name,
      },
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment order" });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !plan
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment details" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Payment verification failed - Invalid signature",
        });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const planDetails = PLANS[plan];

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        "subscription.plan": plan,
        "subscription.status": "active",
        "subscription.startDate": new Date(),
        "subscription.endDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "subscription.razorpayOrderId": razorpay_order_id,
        "subscription.razorpayPaymentId": razorpay_payment_id,
        tweetCount: 0,
      },
      { new: true },
    );

    const emailResult = await sendSubscriptionInvoice({
      userEmail: user.email,
      userName: user.name,
      plan: plan,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: planDetails.amount,
    });

    res.json({
      success: true,
      message: `🎉 Subscription upgraded to ${planDetails.name} successfully!`,
      subscription: user.subscription,
      tweetLimit: user.getTweetLimit(),
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
});

router.get("/subscription", protect, async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    subscription: user.subscription,
    tweetCount: user.tweetCount,
    tweetLimit: user.getTweetLimit(),
    canPost: user.canPost(),
  });
});

module.exports = router;
