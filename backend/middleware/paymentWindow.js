/**
 * Middleware to restrict payments to a specific time window (IST).
 * Allowed: 10:00 AM – 11:00 AM IST
 */
const paymentTimeWindow = (req, res, next) => {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  const istTime = new Date(now.getTime() + istOffset);

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  const startHour = parseInt(process.env.PAYMENT_WINDOW_START) || 10;
  const endHour = parseInt(process.env.PAYMENT_WINDOW_END) || 11;

  // Allow between 10:00 AM (inclusive) and 11:00 AM (exclusive)
  const isWithinWindow =
    hours >= startHour && (hours < endHour || (hours === endHour && minutes === 0));

  if (!isWithinWindow) {
    const formattedIST = istTime.toUTCString().replace("GMT", "IST");
    return res.status(403).json({
      success: false,
      message: `Payments are only allowed between ${startHour}:00 AM and ${endHour}:00 AM IST.`,
      currentIST: formattedIST,
      allowedWindow: `${startHour}:00 AM – ${endHour}:00 AM IST`,
    });
  }

  next();
};

module.exports = { paymentTimeWindow };
