'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [blocked, setBlocked]       = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!identifier.trim()) return toast.error('Enter your email or phone number');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/forgot-password/request`, { identifier });
      if (res.data.success) setDone(true);
    } catch (err) {
      const d = err.response?.data;
      if (d?.tooManyRequests) { setBlocked(true); return; }
      toast.error(d?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (blocked) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize:48, textAlign:'center' }}>🚫</div>
          <h2 style={{ ...S.title, color:'#ef4444' }}>Daily Limit Reached</h2>
          <p style={S.sub}>You can only reset your password once per day.<br />Please try again tomorrow.</p>
          <button style={S.btn} onClick={() => router.push('/')}>← Back to Login</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize:48, textAlign:'center' }}>📧</div>
          <h2 style={S.title}>Password Sent!</h2>
          <p style={S.sub}>A new password has been sent to your registered email address. Please check your inbox and log in.</p>
          <button style={S.btn} onClick={() => router.push('/')}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🐦 TweetApp</div>
        <h2 style={S.title}>Forgot Password</h2>
        <p style={S.sub}>Enter your registered email or phone number. We'll send you a new password.</p>
        <input
          style={S.input}
          type="text"
          placeholder="Email or Phone Number"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <div style={{ fontSize:12, color:'#9ca3af', marginBottom:14 }}>
          ⚠️ You can only request a password reset once per day.
        </div>
        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Sending...' : 'Send New Password'}
        </button>
        <div style={{ textAlign:'center', marginTop:14 }}>
          <a href="/" style={S.link}>← Back to Login</a>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:  { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', padding:16 },
  card:  { background:'#fff', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:420, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' },
  logo:  { fontSize:26, fontWeight:800, color:'#1da1f2', textAlign:'center', marginBottom:8 },
  title: { fontSize:22, fontWeight:700, color:'#1f2937', textAlign:'center', marginBottom:6 },
  sub:   { fontSize:14, color:'#6b7280', textAlign:'center', marginBottom:16 },
  input: { width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'12px 14px', fontSize:15, outline:'none', fontFamily:'inherit', marginBottom:10, display:'block' },
  btn:   { width:'100%', background:'linear-gradient(135deg,#1da1f2,#0d8ecf)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer' },
  link:  { color:'#1da1f2', textDecoration:'none', fontWeight:600, fontSize:14 },
};
