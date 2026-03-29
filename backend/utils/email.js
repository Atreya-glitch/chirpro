const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const PLAN_DETAILS = {
  bronze: { name: "Bronze Plan", price: 100, tweets: "3 tweets/month" },
  silver: { name: "Silver Plan", price: 300, tweets: "5 tweets/month" },
  gold: { name: "Gold Plan", price: 1000, tweets: "Unlimited tweets/month" },
};

const sendSubscriptionInvoice = async ({
  userEmail,
  userName,
  plan,
  paymentId,
  orderId,
  amount,
}) => {
  const transporter = createTransporter();
  const planInfo = PLAN_DETAILS[plan];
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const invoiceNumber = `INV-${Date.now()}`;
  const expiryDate = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - TweetApp</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #1da1f2 0%, #0d8ecf 100%); padding: 36px 40px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: #d0eeff; margin: 6px 0 0; font-size: 15px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 4px 16px; border-radius: 20px; font-size: 13px; margin-top: 10px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 17px; color: #222; margin-bottom: 20px; }
    .invoice-meta { display: flex; justify-content: space-between; background: #f0f7ff; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .invoice-meta div { font-size: 13px; color: #555; }
    .invoice-meta strong { display: block; font-size: 15px; color: #222; }
    .plan-box { border: 2px solid #1da1f2; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .plan-name { font-size: 22px; font-weight: 700; color: #1da1f2; margin: 0 0 8px; }
    .plan-feature { color: #555; font-size: 14px; margin: 4px 0; }
    .plan-feature::before { content: "✓ "; color: #1da1f2; font-weight: bold; }
    .amount-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; color: #444; border-bottom: 1px solid #f0f0f0; }
    .amount-total { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 18px; font-weight: 700; color: #1da1f2; }
    .payment-info { background: #f9f9f9; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #666; }
    .payment-info span { display: block; margin: 4px 0; }
    .success-banner { background: #e6f9ee; border-left: 4px solid #22c55e; padding: 12px 18px; border-radius: 6px; color: #166534; font-size: 14px; margin-bottom: 20px; }
    .footer { background: #f4f6fb; padding: 20px 40px; text-align: center; font-size: 12px; color: #aaa; }
    .footer a { color: #1da1f2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐦 TweetApp</h1>
      <p>Payment Invoice & Subscription Confirmation</p>
      <span class="badge">✓ Payment Successful</span>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${userName}</strong>,</p>
      <div class="success-banner">
        🎉 Your subscription has been activated! You can now enjoy all the benefits of your <strong>${planInfo.name}</strong>.
      </div>

      <div class="invoice-meta">
        <div>
          <span>Invoice Number</span>
          <strong>${invoiceNumber}</strong>
        </div>
        <div>
          <span>Invoice Date</span>
          <strong>${invoiceDate}</strong>
        </div>
        <div>
          <span>Valid Until</span>
          <strong>${expiryDate}</strong>
        </div>
      </div>

      <div class="plan-box">
        <p class="plan-name">${planInfo.name}</p>
        <p class="plan-feature">${planInfo.tweets}</p>
        <p class="plan-feature">Valid for 30 days from activation</p>
        <p class="plan-feature">24/7 Priority support</p>
      </div>

      <div class="amount-row"><span>Subscription Plan</span><span>${planInfo.name}</span></div>
      <div class="amount-row"><span>Duration</span><span>1 Month</span></div>
      <div class="amount-row"><span>Subtotal</span><span>₹${amount}</span></div>
      <div class="amount-row"><span>GST (18%)</span><span>Included</span></div>
      <div class="amount-total"><span>Total Paid</span><span>₹${amount}</span></div>

      <div class="payment-info">
        <span>💳 <strong>Payment ID:</strong> ${paymentId}</span>
        <span>📦 <strong>Order ID:</strong> ${orderId}</span>
        <span>🏦 <strong>Payment Method:</strong> Razorpay</span>
        <span>📅 <strong>Payment Date:</strong> ${invoiceDate}</span>
      </div>

      <p style="color:#555; font-size:14px;">If you have any questions about your subscription, feel free to reply to this email. We're here to help!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TweetApp. All rights reserved.</p>
      <p>This is an automated invoice. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"TweetApp" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: `✅ Invoice & Subscription Confirmed – ${planInfo.name} | TweetApp`,
    html: htmlContent,
    text: `Hi ${userName}, your ${planInfo.name} subscription has been activated. Payment ID: ${paymentId}, Amount: ₹${amount}. Valid until ${expiryDate}.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Invoice email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending invoice email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async ({ userEmail, userName, newPassword }) => {
  const transporter = createTransporter();
  const resetDate = new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset - TweetApp</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #1da1f2 0%, #0d8ecf 100%); padding: 32px 40px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 26px; }
    .header p { color: #d0eeff; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 18px; border-radius: 6px; color: #92400e; font-size: 13px; margin-bottom: 22px; }
    .password-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 22px; }
    .password-label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .password-value { font-size: 28px; font-weight: 800; color: #166534; letter-spacing: 3px; font-family: 'Courier New', monospace; }
    .password-note { font-size: 12px; color: #6b7280; margin-top: 8px; }
    .security-tip { background: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #555; margin-bottom: 16px; }
    .security-tip ul { margin: 8px 0 0 16px; padding: 0; }
    .security-tip li { margin: 4px 0; }
    .footer { background: #f4f6fb; padding: 18px 40px; text-align: center; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
      <p>TweetApp Account Recovery</p>
    </div>
    <div class="body">
      <p style="font-size:16px;color:#222;margin-bottom:18px;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#555;font-size:14px;margin-bottom:18px;">
        We received a request to reset your TweetApp password on <strong>${resetDate}</strong>. Your new temporary password has been generated below.
      </p>
      <div class="info-box">
        Important: This is a one-time password reset. You can only request a reset <strong>once per day</strong>.
      </div>
      <div class="password-box">
        <div class="password-label">Your New Password</div>
        <div class="password-value">${newPassword}</div>
        <div class="password-note">Letters only - No numbers - No special characters</div>
      </div>
      <div class="security-tip">
        <strong>Security Tips:</strong>
        <ul>
          <li>Log in immediately and change this password to something memorable.</li>
          <li>Do not share this password with anyone.</li>
          <li>If you did not request this reset, please contact support immediately.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TweetApp. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"TweetApp Security" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `Your New TweetApp Password`,
      html: htmlContent,
      text: `Hi ${userName}, your new TweetApp password is: ${newPassword}. Please log in and change it immediately.`,
    });
    console.log("Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendOtpEmail = async ({
  userEmail,
  userName,
  otp,
  ipAddress,
  browser,
  device,
}) => {
  const transporter = createTransporter();
  const sentAt = new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login OTP - TweetApp</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #1da1f2, #0d8ecf); padding: 28px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: #d0eeff; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px 40px; }
    .otp-box { background: #f0f9ff; border: 2px dashed #1da1f2; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
    .otp-label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .otp-code { font-size: 44px; font-weight: 900; color: #0369a1; letter-spacing: 12px; font-family: 'Courier New', monospace; }
    .otp-expiry { font-size: 12px; color: #6b7280; margin-top: 10px; }
    .device-info { background: #f9fafb; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #555; margin: 16px 0; }
    .device-info span { display: block; margin: 3px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin-top: 16px; }
    .footer { background: #f4f6fb; padding: 16px 40px; text-align: center; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Login Verification</h1>
      <p>TweetApp Chrome Authentication</p>
    </div>
    <div class="body">
      <p style="color:#222; font-size:15px;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#555; font-size:14px;">A login attempt was detected from Google Chrome. Use the OTP below to complete your sign-in:</p>

      <div class="otp-box">
        <div class="otp-label">One-Time Password</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">Valid for 10 minutes only</div>
      </div>

      <div class="device-info">
        <span>🌐 <strong>Browser:</strong> ${browser}</span>
        <span>💻 <strong>Device:</strong> ${device}</span>
        <span>🌍 <strong>IP Address:</strong> ${ipAddress}</span>
        <span>🕐 <strong>Time:</strong> ${sentAt}</span>
      </div>

      <div class="warning">
        If you did not attempt to log in, please change your password immediately and contact support.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TweetApp. Do not share this OTP with anyone.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"TweetApp Security" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `${otp} is your TweetApp Login OTP`,
      html: htmlContent,
      text: `Hi ${userName}, your TweetApp login OTP is: ${otp}. Valid for 10 minutes. Do not share it.`,
    });
    console.log("OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendAudioUploadOtpEmail = async ({ userEmail, userName, otp }) => {
  const transporter = createTransporter();
  const sentAt = new Date().toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Audio Upload OTP - TweetApp</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrap { max-width: 540px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .head { background: linear-gradient(135deg,#7c3aed,#6d28d9); padding: 28px 40px; text-align: center; }
    .head h1 { color:#fff; margin:0; font-size:22px; }
    .head p  { color:#ddd6fe; margin:5px 0 0; font-size:13px; }
    .body { padding: 30px 36px; }
    .otp-box { background:#faf5ff; border:2px dashed #7c3aed; border-radius:12px; padding:22px; text-align:center; margin:18px 0; }
    .otp-label { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
    .otp-code  { font-size:46px; font-weight:900; color:#5b21b6; letter-spacing:12px; font-family:'Courier New',monospace; }
    .otp-sub   { font-size:12px; color:#9ca3af; margin-top:8px; }
    .rules { background:#f5f3ff; border-left:4px solid #7c3aed; border-radius:6px; padding:12px 16px; font-size:13px; color:#4c1d95; margin:14px 0; }
    .rules ul { margin:6px 0 0 16px; padding:0; }
    .rules li { margin:3px 0; }
    .warn { background:#fef3c7; border-left:4px solid #f59e0b; padding:10px 14px; border-radius:6px; font-size:12px; color:#92400e; margin-top:14px; }
    .foot { background:#f4f6fb; padding:14px 36px; text-align:center; font-size:11px; color:#aaa; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>🎙️ Audio Tweet Upload</h1>
      <p>Verification OTP – TweetApp</p>
    </div>
    <div class="body">
      <p style="color:#222;font-size:15px;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#555;font-size:14px;margin-bottom:4px;">
        You requested to upload an audio tweet. Use the OTP below to authorise your upload:
      </p>
      <div class="otp-box">
        <div class="otp-label">One-Time Password</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-sub">Valid for 10 minutes only · Single use</div>
      </div>
      <div class="rules">
        <strong>Upload Rules:</strong>
        <ul>
          <li>Maximum duration: <strong>5 minutes (300 seconds)</strong></li>
          <li>Maximum file size: <strong>100 MB</strong></li>
          <li>Allowed formats: MP3, WAV, OGG, AAC, M4A, WebM, FLAC</li>
          <li>Upload window: <strong>2:00 PM – 7:00 PM IST only</strong></li>
        </ul>
      </div>
      <div class="warn">
        If you did not request this, please ignore this email and secure your account.
      </div>
      <p style="color:#9ca3af;font-size:11px;margin-top:14px;">Requested at ${sentAt}</p>
    </div>
    <div class="foot">© ${new Date().getFullYear()} TweetApp · Do not share this OTP.</div>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: `"TweetApp" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `${otp} – Your Audio Upload OTP | TweetApp`,
      html,
      text: `Hi ${userName}, your audio upload OTP is: ${otp}. Valid 10 minutes. Do not share.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Audio OTP email error:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendSubscriptionInvoice,
  sendPasswordResetEmail,
  sendOtpEmail,
  sendAudioUploadOtpEmail,
};
