"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import {
  getNotificationPermission,
  requestNotificationPermission,
  REQUIRED_KEYWORDS,
  fireTweetNotification,
  detectKeywords,
} from "@/utils/notificationUtils";

const PLAN_COLORS = {
  free: "#6b7280",
  bronze: "#b45309",
  silver: "#4b5563",
  gold: "#d97706",
};
const PLAN_ICONS = { free: "🆓", bronze: "🥉", silver: "🥈", gold: "🥇" };
const PERM_INFO = {
  granted: { label: "Granted", color: "#22c55e", bg: "#f0fdf4", icon: "✅" },
  denied: { label: "Denied", color: "#ef4444", bg: "#fef2f2", icon: "🚫" },
  default: { label: "Not Asked", color: "#f59e0b", bg: "#fffbeb", icon: "⚠️" },
  unsupported: {
    label: "Unsupported",
    color: "#6b7280",
    bg: "#f9fafb",
    icon: "❌",
  },
};

export default function ProfilePage() {
  const { user, getAuthHeaders, refreshUser, API_URL } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingP] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [keywords, setKeywords] = useState([...REQUIRED_KEYWORDS]);
  const [newKw, setNewKw] = useState("");
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState("default");
  const [reqPerm, setReqPerm] = useState(false);
  const [preview, setPreview] = useState("");
  const router = useRouter();

  useEffect(() => {
    setPermission(getNotificationPermission());
    const t = setInterval(
      () => setPermission(getNotificationPermission()),
      2000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile`, {
          headers: getAuthHeaders(),
        });
        const p = res.data.profile;
        setProfile(p);
        setNotifEnabled(p.notificationPreferences?.enabled ?? true);
        const merged = [
          ...new Set([
            ...REQUIRED_KEYWORDS,
            ...(p.notificationPreferences?.keywords || []),
          ]),
        ];
        setKeywords(merged);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoadingP(false);
      }
    };
    if (user) fetch();
  }, [user]);

  const handleRequestPermission = async () => {
    setReqPerm(true);
    const r = await requestNotificationPermission();
    setPermission(r);
    setReqPerm(false);
    if (r === "granted") toast.success("Notifications enabled! 🔔");
    else if (r === "denied")
      toast.error("Permission denied — enable in browser settings.");
    else toast("Dismissed.", { icon: "ℹ️" });
  };

  const addKeyword = () => {
    const kw = newKw.trim().toLowerCase();
    if (!kw) return;
    if (kw.length > 50) return toast.error("Keyword too long (max 50 chars)");
    if (keywords.includes(kw)) return toast("Already in list", { icon: "ℹ️" });
    if (keywords.length >= 20) return toast.error("Max 20 keywords");
    setKeywords([...keywords, kw]);
    setNewKw("");
  };

  const removeKeyword = (kw) => {
    if (REQUIRED_KEYWORDS.includes(kw)) return toast.error(`"${kw}" is locked`);
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/profile/notifications`,
        { enabled: notifEnabled, keywords },
        { headers: getAuthHeaders() },
      );
      toast.success("Saved ✅");
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFireTest = () => {
    if (permission !== "granted") return toast.error("Grant permission first");
    if (!notifEnabled) return toast.error("Notifications disabled");
    const text =
      preview.trim() || "The cricket match was incredible! Science proves it.";
    const { matched, matchedKeywords } = detectKeywords(text, keywords);
    if (!matched)
      return toast("No keywords matched — no notification.", { icon: "🔕" });
    fireTweetNotification({ _id: "preview", content: text }, matchedKeywords);
    toast.success(
      `Fired for: ${matchedKeywords.map((k) => `#${k}`).join(", ")}`,
    );
  };

  const permCfg = PERM_INFO[permission] || PERM_INFO.default;
  const plan = profile?.subscription?.plan || "free";

  if (!user || loadingProfile)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "#9ca3af",
          fontSize: 16,
        }}
      >
        Loading...
      </div>
    );

  return (
    <div style={S.layout}>
      <Sidebar />
      <main style={S.main}>
        <h2 style={S.heading}>👤 My Profile</h2>

        <div style={S.card}>
          <h3 style={S.cardTitle}>📋 Account Overview</h3>
          {[
            ["👤", "Name", profile?.name],
            ["📧", "Email", profile?.email],
            ["📱", "Phone", profile?.phone || "Not set"],
            [
              "📅",
              "Member Since",
              new Date(profile?.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            ],
          ].map(([icon, label, value]) => (
            <div key={label} style={S.infoRow}>
              <span style={{ fontSize: 18, width: 24 }}>{icon}</span>
              <span
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  fontWeight: 600,
                  width: 100,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 500 }}>
                {value}
              </span>
            </div>
          ))}
          <div
            style={{
              ...S.planBadge,
              borderColor: PLAN_COLORS[plan],
              marginTop: 14,
            }}
          >
            <span style={{ fontSize: 28 }}>{PLAN_ICONS[plan]}</span>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: PLAN_COLORS[plan],
                  fontSize: 16,
                  textTransform: "capitalize",
                }}
              >
                {plan} Plan
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {profile?.tweetLimit === Infinity
                  ? "Unlimited tweets"
                  : `${profile?.tweetCount} / ${profile?.tweetLimit} tweets used`}
              </div>
            </div>
            {plan === "free" && (
              <button style={S.upgBtn} onClick={() => router.push("/plans")}>
                Upgrade →
              </button>
            )}
          </div>
        </div>

        <div style={S.card}>
          <h3 style={S.cardTitle}>🔔 Notification Settings</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
            Receive browser popups when tweets contain your watched keywords.{" "}
            <strong>&quot;cricket&quot;</strong> and{" "}
            <strong>&quot;science&quot;</strong> are always active.
          </p>

          <div
            style={{
              ...S.permBox,
              background: permCfg.bg,
              borderColor: permCfg.color,
            }}
          >
            <span style={{ fontSize: 22 }}>{permCfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontWeight: 700, color: permCfg.color, fontSize: 14 }}
              >
                Browser Permission: {permCfg.label}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {permission === "granted" &&
                  "Browser will show popup notifications."}
                {permission === "denied" &&
                  "Blocked. Go to browser Settings → Site Settings to unblock."}
                {permission === "default" &&
                  'Click "Enable Notifications" to allow popups.'}
                {permission === "unsupported" &&
                  "Your browser does not support the Notification API."}
              </div>
            </div>
            {(permission === "default" || permission === "denied") &&
              permission !== "unsupported" && (
                <button
                  style={{ ...S.permBtn, opacity: reqPerm ? 0.7 : 1 }}
                  onClick={handleRequestPermission}
                  disabled={reqPerm || permission === "denied"}
                >
                  {reqPerm
                    ? "Requesting…"
                    : permission === "denied"
                      ? "Blocked"
                      : "Enable Notifications"}
                </button>
              )}
          </div>

          <div style={S.toggleRow}>
            <div>
              <div style={{ fontWeight: 600, color: "#1f2937" }}>
                {notifEnabled ? "🔔 Enabled" : "🔕 Disabled"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {notifEnabled
                  ? "Popup notifications will fire for matching tweets."
                  : "No notifications will be shown."}
              </div>
            </div>
            <div
              style={{
                ...S.toggle,
                background: notifEnabled ? "#1da1f2" : "#d1d5db",
              }}
              onClick={() => setNotifEnabled(!notifEnabled)}
            >
              <div
                style={{
                  ...S.knob,
                  transform: notifEnabled
                    ? "translateX(22px)"
                    : "translateX(2px)",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              🏷️ Watched Keywords
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
              Required keywords (cricket, science) are locked 🔒.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {keywords.map((kw) => {
                const req = REQUIRED_KEYWORDS.includes(kw);
                return (
                  <div
                    key={kw}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 12px",
                      borderRadius: 20,
                      border: "1.5px solid",
                      background: req ? "#eff6ff" : "#f9fafb",
                      borderColor: req ? "#bfdbfe" : "#e5e7eb",
                      color: req ? "#1d4ed8" : "#374151",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {req && (
                      <span style={{ fontSize: 11, marginRight: 2 }}>🔒</span>
                    )}
                    #{kw}
                    {!req && (
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          fontSize: 16,
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: 2,
                          fontWeight: 700,
                        }}
                        onClick={() => removeKeyword(kw)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={S.kwInput}
                type="text"
                placeholder="Add keyword (e.g. football)"
                value={newKw}
                onChange={(e) => setNewKw(e.target.value.slice(0, 50))}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <button style={S.addBtn} onClick={addKeyword}>
                + Add
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              background: "#f9fafb",
              borderRadius: 10,
              padding: "16px 18px",
              border: "1.5px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: 6,
                fontSize: 14,
              }}
            >
              🧪 Test Notification
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
              Type sample text and fire a test popup.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...S.kwInput, flex: 1 }}
                type="text"
                placeholder='e.g. "The cricket match was epic!"'
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFireTest()}
              />
              <button
                style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1.5px solid #bbf7d0",
                  borderRadius: 8,
                  padding: "9px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                onClick={handleFireTest}
              >
                🔔 Fire Test
              </button>
            </div>
            {preview &&
              (() => {
                const { matched, matchedKeywords } = detectKeywords(
                  preview,
                  keywords,
                );
                return (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {matched ? (
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>
                        ✅ Would notify:{" "}
                        {matchedKeywords.map((k) => `#${k}`).join(", ")}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>
                        🔕 No keywords matched
                      </span>
                    )}
                  </div>
                );
              })()}
          </div>

          <button
            style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "💾 Save Notification Preferences"}
          </button>
        </div>
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
  main: { flex: 1, display: "flex", flexDirection: "column", gap: 20 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1f2937" },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "22px 24px",
    border: "1.5px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 16px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  planBadge: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#f9fafb",
    border: "2px solid",
    borderRadius: 12,
    padding: "14px 18px",
  },
  upgBtn: {
    background: "#1da1f2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginLeft: "auto",
  },
  permBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "14px 18px",
    borderRadius: 10,
    border: "1.5px solid",
    marginBottom: 18,
  },
  permBtn: {
    background: "#1da1f2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f9fafb",
    borderRadius: 10,
    padding: "14px 18px",
    gap: 16,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.3s",
    flexShrink: 0,
  },
  knob: {
    width: 22,
    height: 22,
    background: "#fff",
    borderRadius: "50%",
    position: "absolute",
    top: 2,
    transition: "transform 0.3s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  },
  kwInput: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    flex: 1,
  },
  addBtn: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1.5px solid #bfdbfe",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  saveBtn: {
    background: "linear-gradient(135deg,#1da1f2,#0d8ecf)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 22,
    width: "100%",
  },
};
