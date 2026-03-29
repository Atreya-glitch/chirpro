const paymentTimeWindow = (req, res, next) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  const startHour = parseInt(process.env.PAYMENT_WINDOW_START) || 10;
  const endHour = parseInt(process.env.PAYMENT_WINDOW_END) || 11;

  const isWithinWindow =
    hours >= startHour &&
    (hours < endHour || (hours === endHour && minutes === 0));

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
