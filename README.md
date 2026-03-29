# 🐦 TweetApp — Next.js + Express.js

Full-stack Twitter-like subscription platform.

## Architecture

```
tweetapp/
├── backend/          Express.js + MongoDB API server (port 5000)
└── frontend/         Next.js 14 App Router (port 3000)
```

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# Edit .env with your MongoDB URI, Razorpay keys, and SMTP credentials
npm run dev         # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
# Edit .env.local with your Razorpay test key
npm run dev         # starts on http://localhost:3000
```

---

## Features

| Feature | Details |
|---------|---------|
| Auth | Register, Login with JWT |
| Login Security | Chrome → OTP via email; Mobile → restricted to 10AM–1PM IST; Microsoft browser → direct |
| Subscription Plans | Free (1 tweet), Bronze ₹100 (3), Silver ₹300 (5), Gold ₹1000 (unlimited) |
| Payment | Razorpay, only 10–11 AM IST window |
| Invoice Email | Auto-sent after successful payment |
| Forgot Password | Letters-only password, once per day via email/phone |
| Audio Tweets | OTP-gated upload, 2–7 PM IST window, max 5 min / 100 MB |
| Notifications | Browser Notification API — keyword alerts for #cricket, #science + custom keywords |
| Login History | Last 20 sessions with browser/OS/IP/device details |
| Profile Page | Account overview + notification preferences management |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| POST | /api/auth/verify-otp | ❌ | Chrome OTP verify |
| POST | /api/auth/resend-otp | ❌ | Resend OTP |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/auth/login-history | ✅ | Last 20 sessions |
| GET | /api/payment/plans | ❌ | All plans |
| POST | /api/payment/create-order | ✅ | Razorpay order |
| POST | /api/payment/verify | ✅ | Verify payment |
| GET | /api/payment/subscription | ✅ | Subscription info |
| GET | /api/tweets | ✅ | Tweet feed |
| POST | /api/tweets | ✅ | Post tweet |
| DELETE | /api/tweets/:id | ✅ | Delete tweet |
| POST | /api/forgot-password/request | ❌ | Reset password |
| GET | /api/forgot-password/check-limit | ❌ | Check daily limit |
| GET | /api/audio-tweets/status | ✅ | Window status |
| POST | /api/audio-tweets/request-otp | ✅ | Audio upload OTP |
| POST | /api/audio-tweets/verify-otp | ✅ | Verify audio OTP |
| POST | /api/audio-tweets/upload | ✅ | Upload audio |
| GET | /api/audio-tweets | ✅ | Audio feed |
| GET | /api/audio-tweets/my | ✅ | My audio tweets |
| DELETE | /api/audio-tweets/:id | ✅ | Delete audio tweet |
| GET | /api/profile | ✅ | Full profile |
| PATCH | /api/profile/notifications | ✅ | Update notification prefs |

---

## Next.js Frontend Structure

```
frontend/src/
├── app/
│   ├── layout.js              # Root layout with AuthProvider + Toaster
│   ├── page.js                # / → Auth page
│   ├── not-found.js           # 404
│   ├── globals.css
│   ├── forgot-password/page.js
│   ├── dashboard/
│   │   ├── layout.js          # AuthGuard wrapper
│   │   └── page.js
│   ├── plans/
│   │   ├── layout.js
│   │   └── page.js
│   ├── login-history/
│   │   ├── layout.js
│   │   └── page.js
│   ├── audio-tweets/
│   │   ├── layout.js
│   │   └── page.js
│   └── profile/
│       ├── layout.js
│       └── page.js
├── components/
│   ├── AuthPage.js            # Login/Register/OTP UI
│   ├── AuthGuard.js           # Redirect to / if not logged in
│   ├── Sidebar.js             # Shared sidebar navigation
│   └── ToastProvider.js       # react-hot-toast
├── context/
│   └── AuthContext.js         # JWT token + user state
├── hooks/
│   └── useNotifications.js    # Browser Notification API hook
└── utils/
    └── notificationUtils.js   # Keyword detection + notification firing
```

---

## Environment Variables

### backend/.env
```
MONGO_URI=mongodb://localhost:27017/tweetapp
JWT_SECRET=change_this_secret
RAZORPAY_KEY_ID=rzp_test_SWvw1vD9WCQD2t
RAZORPAY_KEY_SECRET=6UPCiw8X9MC5m6hxTQRXLXEd
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=app_password
EMAIL_FROM=you@gmail.com
CLIENT_URL=http://localhost:3000
PORT=5000
PAYMENT_WINDOW_START=10
PAYMENT_WINDOW_END=11
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_SWvw1vD9WCQD2t
```
