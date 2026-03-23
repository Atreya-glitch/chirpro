const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "audio");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Storage engine ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".audio";
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ── File filter — accept common audio MIME types ──────────────────────────────
const ALLOWED_MIME = [
  "audio/mpeg",       // .mp3
  "audio/mp3",
  "audio/wav",        // .wav
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",        // .ogg
  "audio/aac",        // .aac
  "audio/mp4",        // .m4a / .mp4 audio
  "audio/x-m4a",
  "audio/webm",       // .webm audio (browser MediaRecorder default)
  "audio/flac",       // .flac
];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported audio format: ${file.mimetype}. ` +
        "Allowed formats: MP3, WAV, OGG, AAC, M4A, WebM, FLAC."
      ),
      false
    );
  }
};

// ── Multer instance — 100 MB size limit enforced here ────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

module.exports = { upload, UPLOAD_DIR };
