"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function AudioTweetsPage() {
  const { user, getAuthHeaders, API_URL } = useAuth();
  const [feed, setFeed] = useState([]);
  const [myTweets, setMyTweets] = useState([]);
  const [tab, setTab] = useState("feed");
  const [status, setStatus] = useState(null);
  const [fetching, setFetching] = useState(true);

  const [otpSessionId, setOtpSessionId] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (user) init();
  }, [user]);

  const init = async () => {
    try {
      const [statusRes, feedRes, myRes] = await Promise.all([
        axios.get(`${API_URL}/audio-tweets/status`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_URL}/audio-tweets`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/audio-tweets/my`, { headers: getAuthHeaders() }),
      ]);
      setStatus(statusRes.data);
      setFeed(feedRes.data.audioTweets);
      setMyTweets(myRes.data.audioTweets);
    } catch {
      toast.error("Failed to load audio tweets");
    } finally {
      setFetching(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/audio-tweets/request-otp`,
        {},
        { headers: getAuthHeaders() },
      );
      setOtpSessionId(res.data.otpSessionId);
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return toast.error("Enter OTP");
    setOtpLoading(true);
    try {
      await axios.post(
        `${API_URL}/audio-tweets/verify-otp`,
        { otpSessionId, otp: otpCode },
        { headers: getAuthHeaders() },
      );
      setOtpVerified(true);
      toast.success("OTP verified! You can now upload 🎙️");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Select an audio file");
    if (!otpVerified) return toast.error("Verify OTP first");
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", file);
    fd.append("otpSessionId", otpSessionId);
    fd.append("caption", caption);
    try {
      const res = await axios.post(`${API_URL}/audio-tweets/upload`, fd, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      const newAt = res.data.audioTweet;
      setFeed((prev) => [newAt, ...prev]);
      setMyTweets((prev) => [newAt, ...prev]);
      setFile(null);
      setCaption("");
      setOtpVerified(false);
      setOtpSessionId("");
      setOtpCode("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Audio tweet posted! 🎙️");
    } catch (err) {
      const d = err.response?.data;
      if (d?.windowClosed) toast.error("Upload window is closed (2–7 PM IST)");
      else if (d?.durationExceeded) toast.error(d.message);
      else if (d?.sizeExceeded) toast.error("File too large (max 100 MB)");
      else toast.error(d?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/audio-tweets/${id}`, {
        headers: getAuthHeaders(),
      });
      setFeed((prev) => prev.filter((t) => t._id !== id));
      setMyTweets((prev) => prev.filter((t) => t._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const formatDur = (s) =>
    `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

  if (!user) return null;

  return (
    <div style={S.layout}>
      <Sidebar />
      <main style={S.main}>
        <h2 style={S.heading}>🎙️ Audio Tweets</h2>

        {status && (
          <div
            style={{
              ...S.statusBar,
              background: status.windowOpen ? "#f0fdf4" : "#fff7ed",
              borderColor: status.windowOpen ? "#bbf7d0" : "#fed7aa",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: status.windowOpen ? "#166534" : "#92400e",
              }}
            >
              {status.windowOpen
                ? "✅ Upload window is OPEN"
                : "🕐 Upload window CLOSED"}{" "}
              · {status.currentIST}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Allowed: {status.allowedWindow} · Max 5 min · Max 100 MB ·
              MP3/WAV/OGG/AAC/M4A/FLAC
            </div>
          </div>
        )}

        {status?.windowOpen && (
          <div style={S.uploadCard}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#7c3aed",
                marginBottom: 14,
              }}
            >
              📤 Post an Audio Tweet
            </h3>
            {!otpSessionId ? (
              <button
                style={S.otpBtn}
                onClick={handleRequestOtp}
                disabled={otpLoading}
              >
                {otpLoading ? "Sending OTP..." : "📧 Send OTP to My Email"}
              </button>
            ) : !otpVerified ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <input
                  style={S.otpInput}
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
                <button
                  style={S.otpBtn}
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  style={{
                    ...S.otpBtn,
                    background: "#f9fafb",
                    color: "#374151",
                  }}
                  onClick={handleRequestOtp}
                >
                  Resend
                </button>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  color: "#22c55e",
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                ✅ OTP Verified – ready to upload
              </div>
            )}
            {otpVerified && (
              <>
                <input
                  type="file"
                  accept="audio/*"
                  ref={fileRef}
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  style={{ marginBottom: 10, display: "block", fontSize: 14 }}
                />
                <textarea
                  style={{ ...S.captionInput }}
                  placeholder="Caption (optional, max 280 chars)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                  rows={2}
                />
                <button
                  style={S.uploadBtn}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "🎙️ Post Audio Tweet"}
                </button>
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {[
            ["feed", "📡 All Audio"],
            ["mine", "🎙️ My Audio"],
          ].map(([val, label]) => (
            <button
              key={val}
              style={{
                ...S.tabBtn,
                background: tab === val ? "#7c3aed" : "#f3f4f6",
                color: tab === val ? "#fff" : "#374151",
              }}
              onClick={() => setTab(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {fetching ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
            Loading...
          </div>
        ) : (tab === "feed" ? feed : myTweets).length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              padding: 60,
              background: "#fff",
              borderRadius: 14,
              border: "1.5px solid #e5e7eb",
            }}
          >
            No audio tweets yet 🎙️
          </div>
        ) : (
          (tab === "feed" ? feed : myTweets).map((t) => (
            <div key={t._id} style={S.tweetCard}>
              <div style={S.tAvatar}>{t.user?.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#1f2937" }}>
                    {t.user?.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      background: "#f5f3ff",
                      color: "#7c3aed",
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 700,
                    }}
                  >
                    🎙️ {formatDur(t.durationSeconds)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginLeft: "auto",
                    }}
                  >
                    {new Date(t.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                {t.caption && (
                  <p
                    style={{
                      color: "#374151",
                      fontSize: 14,
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {t.caption}
                  </p>
                )}
                <audio
                  controls
                  src={t.audioUrl}
                  style={{ width: "100%", height: 36 }}
                />
                {t.user?._id === user?.id && (
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 12,
                      marginTop: 8,
                    }}
                    onClick={() => handleDelete(t._id)}
                  >
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

const S = {
  layout: {
    display: "flex",
    gap: 24,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 16px",
    minHeight: "100vh",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", gap: 14 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1f2937" },
  statusBar: { borderRadius: 12, padding: "12px 18px", border: "1.5px solid" },
  uploadCard: {
    background: "#faf5ff",
    border: "1.5px solid #ddd6fe",
    borderRadius: 14,
    padding: "20px 22px",
  },
  otpBtn: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  otpInput: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    flex: 1,
  },
  captionInput: {
    width: "100%",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    resize: "none",
    marginBottom: 10,
    display: "block",
  },
  uploadBtn: {
    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  tabBtn: {
    border: "none",
    borderRadius: 20,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  tweetCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "18px 20px",
    border: "1.5px solid #e5e7eb",
    display: "flex",
    gap: 14,
  },
  tAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#ede9fe",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
};
