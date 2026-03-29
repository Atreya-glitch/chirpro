"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

const STATUS_INFO = {
  success: { label: "Success", color: "#22c55e", bg: "#f0fdf4", icon: "✅" },
  otp_verified: {
    label: "OTP Verified",
    color: "#3b82f6",
    bg: "#eff6ff",
    icon: "🔐",
  },
  otp_pending: {
    label: "OTP Pending",
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: "⏳",
  },
  blocked_mobile: {
    label: "Blocked (Mobile)",
    color: "#f97316",
    bg: "#fff7ed",
    icon: "📵",
  },
  failed: { label: "Failed", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
};

export default function LoginHistoryPage() {
  const { getAuthHeaders, API_URL } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/login-history`, {
        headers: getAuthHeaders(),
      });
      setSessions(res.data.sessions);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all" ? sessions : sessions.filter((s) => s.status === filter);
  const counts = {
    success: sessions.filter(
      (s) => s.status === "success" || s.status === "otp_verified",
    ).length,
    blocked: sessions.filter(
      (s) => s.status === "blocked_mobile" || s.status === "failed",
    ).length,
  };

  return (
    <div style={S.layout}>
      <Sidebar />
      <main style={S.main}>
        <h2 style={S.heading}>🔒 Login History</h2>

        <div style={S.summaryRow}>
          {[
            { label: "Total Sessions", val: sessions.length, icon: "📋" },
            { label: "Successful", val: counts.success, icon: "✅" },
            { label: "Blocked/Failed", val: counts.blocked, icon: "🚫" },
            {
              label: "OTP Logins",
              val: sessions.filter((s) => s.status === "otp_verified").length,
              icon: "🔐",
            },
          ].map((c) => (
            <div key={c.label} style={S.summaryCard}>
              <div style={{ fontSize: 24 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1f2937" }}>
                {c.val}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={S.filterRow}>
          {[
            ["all", "All"],
            ["success", "Success"],
            ["otp_verified", "OTP"],
            ["blocked_mobile", "Blocked"],
            ["failed", "Failed"],
          ].map(([val, label]) => (
            <button
              key={val}
              style={{
                ...S.filterBtn,
                background: filter === val ? "#1da1f2" : "#f3f4f6",
                color: filter === val ? "#fff" : "#374151",
              }}
              onClick={() => setFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              padding: 40,
              background: "#fff",
              borderRadius: 12,
              border: "1.5px solid #e5e7eb",
            }}
          >
            No sessions found.
          </div>
        ) : (
          filtered.map((s) => {
            const info = STATUS_INFO[s.status] || STATUS_INFO.failed;
            return (
              <div
                key={s._id}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${info.color}30`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{info.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        ...S.statusBadge,
                        background: info.bg,
                        color: info.color,
                      }}
                    >
                      {info.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(s.loginAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                      gap: 8,
                      fontSize: 13,
                      color: "#555",
                    }}
                  >
                    <span>🌐 {s.browser}</span>
                    <span>💻 {s.os}</span>
                    <span>📱 {s.device}</span>
                    <span>🌍 {s.ipAddress}</span>
                  </div>
                </div>
              </div>
            );
          })
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
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 12,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "16px",
    border: "1.5px solid #e5e7eb",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterBtn: {
    border: "none",
    borderRadius: 20,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
  },
};
