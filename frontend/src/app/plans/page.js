"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Script from "next/script";

const PLAN_COLORS = {
  free: "#6b7280",
  bronze: "#b45309",
  silver: "#4b5563",
  gold: "#d97706",
};
const PLAN_ICONS = { free: "🆓", bronze: "🥉", silver: "🥈", gold: "🥇" };

export default function PlansPage() {
  const { user, getAuthHeaders, refreshUser, API_URL } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState("");
  const [windowOpen, setWindowOpen] = useState(false);
  const [currentIST, setCurrentIST] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const h = ist.getUTCHours();
      const m = ist.getUTCMinutes();
      const per = h < 12 ? "AM" : "PM";
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      setCurrentIST(
        `${String(dh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${per} IST`,
      );
      setWindowOpen(h >= 10 && h < 11);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchPlans = async () => {
    try {
      setPlans([
        { id: "free", name: "Free", price: 0, tweets: 1 },
        { id: "bronze", name: "Bronze", price: 100, tweets: 3 },
        { id: "silver", name: "Silver", price: 300, tweets: 5 },
        { id: "gold", name: "Gold", price: 1000, tweets: "Unlimited" },
      ]);
    } catch {
      toast.error("Failed to load plans");
    }
  };

  const handleSubscribe = async (planId) => {
    if (planId === "free")
      return toast("You already have the free plan!", { icon: "ℹ️" });
    if (!windowOpen)
      return toast.error("Payments only allowed 10:00 AM – 11:00 AM IST");
    setLoading(planId);

    try {
      const { data } = await axios.post(
        `${API_URL}/payment/create-order`,
        { plan: planId },
        { headers: getAuthHeaders() },
      );
      if (!data.success) throw new Error(data.message);

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "TweetApp",
        description: `Upgrade to ${data.order.planName}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
              },
              { headers: getAuthHeaders() },
            );

            if (verifyRes.data.success) {
              toast.success(verifyRes.data.message);
              await refreshUser();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed");
          } finally {
            setLoading("");
          }
        },
        prefill: {
          name: data.user?.name,
          email: data.user?.email,
        },
        modal: {
          ondismiss: () => setLoading(""),
        },
        theme: { color: PLAN_COLORS[planId] || "#1da1f2" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(response.error.description || "Payment failed");
        setLoading("");
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating order");
      setLoading("");
    }
  };

  const currentPlan = user?.subscription?.plan || "free";

  return (
    <div style={S.layout}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <Sidebar />
      <main style={S.main}>
        <div style={S.header}>
          <h2 style={S.heading}>⚡ Subscription Plans</h2>
          <div
            style={{
              ...S.clock,
              background: windowOpen ? "#f0fdf4" : "#fef2f2",
              borderColor: windowOpen ? "#bbf7d0" : "#fecaca",
              color: windowOpen ? "#166534" : "#dc2626",
            }}
          >
            🕐 {currentIST} · Payment window{" "}
            {windowOpen ? "OPEN ✅" : "CLOSED 🔒 (10–11 AM IST)"}
          </div>
        </div>
        <div style={S.grid}>
          {plans.map((plan) => {
            const isActive = currentPlan === plan.id;
            const color = PLAN_COLORS[plan.id] || "#6b7280";
            return (
              <div
                key={plan.id}
                style={{
                  ...S.card,
                  borderColor: isActive ? color : "#e5e7eb",
                  boxShadow: isActive ? `0 0 0 2px ${color}30` : undefined,
                }}
              >
                {isActive && (
                  <div style={{ ...S.badge, background: color }}>
                    Current Plan
                  </div>
                )}
                <div
                  style={{
                    fontSize: 36,
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {PLAN_ICONS[plan.id]}
                </div>
                <h3 style={{ ...S.planName, color }}>{plan.name}</h3>
                <div style={S.price}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 28, fontWeight: 800 }}>Free</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>₹</span>
                      <span style={{ fontSize: 32, fontWeight: 800 }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>
                        /mo
                      </span>
                    </>
                  )}
                </div>
                <div style={S.feature}>
                  {typeof plan.tweets === "number"
                    ? `${plan.tweets} tweet${plan.tweets !== 1 ? "s" : ""}/month`
                    : plan.tweets}
                </div>
                <button
                  style={{
                    ...S.subscribeBtn,
                    background: isActive
                      ? "#e5e7eb"
                      : `linear-gradient(135deg,${color},${color}cc)`,
                    color: isActive ? "#9ca3af" : "#fff",
                    cursor: isActive ? "default" : "pointer",
                  }}
                  onClick={() => !isActive && handleSubscribe(plan.id)}
                  disabled={isActive || !!loading}
                >
                  {loading === plan.id
                    ? "Processing..."
                    : isActive
                      ? "Active Plan"
                      : plan.price === 0
                        ? "Current"
                        : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
        {!windowOpen && (
          <div style={S.windowNote}>
            ⏰ Payments are only accepted between{" "}
            <strong>10:00 AM – 11:00 AM IST</strong>. Come back during that
            window to upgrade.
          </div>
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
  main: { flex: 1, display: "flex", flexDirection: "column", gap: 20 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  heading: { fontSize: 24, fontWeight: 700, color: "#1f2937" },
  clock: {
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 16px",
    borderRadius: 20,
    border: "1.5px solid",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px 20px",
    border: "2px solid",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 14px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  planName: { fontSize: 18, fontWeight: 700, textAlign: "center" },
  price: { textAlign: "center", color: "#1f2937" },
  feature: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  subscribeBtn: {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "11px",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 6,
  },
  windowNote: {
    background: "#fff7ed",
    border: "1.5px solid #fed7aa",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
  },
};
