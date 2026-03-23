/**
 * Middleware: only allows audio tweet uploads between 14:00 and 19:00 IST.
 * Used on POST /api/audio-tweets (the actual upload endpoint).
 */
const audioUploadWindow = (req, res, next) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // UTC+5:30
  const ist = new Date(now.getTime() + istOffset);

  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();

  // Allow 14:00 (inclusive) → 19:00 (exclusive)
  const isOpen = hours >= 14 && hours < 19;

  if (!isOpen) {
    // Format current IST for the response
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const period = hours < 12 ? "AM" : "PM";
    const displayH = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const currentIST = `${String(displayH).padStart(2, "0")}:${mm} ${period} IST`;

    return res.status(403).json({
      success: false,
      windowClosed: true,
      message: "Audio tweet uploads are only allowed between 2:00 PM and 7:00 PM IST.",
      currentIST,
      allowedWindow: "2:00 PM – 7:00 PM IST",
    });
  }

  next();
};

/**
 * Helper used outside middleware context (e.g. frontend checks).
 */
const isAudioWindowOpen = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const h = ist.getUTCHours();
  return h >= 14 && h < 19;
};

module.exports = { audioUploadWindow, isAudioWindowOpen };
