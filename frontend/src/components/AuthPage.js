'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AuthPage() {
  const [mode, setMode]             = useState('login'); 
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [phone, setPhone]           = useState('');
  const [loading, setLoading]       = useState(false);

  const [otpStep, setOtpStep]       = useState(false);
  const [otpCode, setOtpCode]       = useState('');
  const [sessionId, setSessionId]   = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [mobileBlocked, setMobileBlocked] = useState(false);
  const [blockedInfo, setBlockedInfo]     = useState({});

  const { login, register, setUserAndToken } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Email and password are required');
    if (mode === 'register' && !name) return toast.error('Name is required');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(name, email, password, phone);
        toast.success('Account created! Welcome 🎉');
        router.replace('/dashboard');
      } else {
        const data = await login(email, password);
        if (data.blockedMobile) {
          setMobileBlocked(true);
          setBlockedInfo(data);
          return;
        }
        if (data.requiresOtp) {
          setOtpStep(true);
          setSessionId(data.sessionId);
          setMaskedEmail(data.email);
          toast.success('OTP sent to your email!');
          return;
        }
        if (data.microsoftBrowser) toast.success('Logged in via Microsoft browser ✅');
        else toast.success('Welcome back!');
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = 'Something went wrong';
      
      if (err.code && err.code.startsWith('auth/')) {
        switch (err.code) {
          case 'auth/configuration-not-found':
            msg = 'Auth not configured. Please enable Email/Password in Firebase Console.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            msg = 'Invalid email or password';
            break;
          case 'auth/email-already-in-use':
            msg = 'Email already registered';
            break;
          case 'auth/weak-password':
            msg = 'Password is too weak';
            break;
          default:
            msg = err.message || 'Authentication failed';
        }
      } else {
        msg = err?.response?.data?.message || err?.message || msg;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return toast.error('Enter the OTP');
    setOtpLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { sessionId, otp: otpCode });
      setUserAndToken(res.data.user, res.data.token);
      toast.success('OTP verified! Welcome 🎉');
      router.replace('/dashboard');
    } catch (err) {
      const d = err.response?.data;
      if (d?.otpExpired) toast.error('OTP expired. Please login again.');
      else toast.error(d?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { sessionId });
      toast.success('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  if (mobileBlocked) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 48, textAlign:'center', marginBottom: 16 }}>📵</div>
          <h2 style={{ ...S.title, color:'#ef4444' }}>Mobile Login Restricted</h2>
          <p style={S.sub}>Mobile device login is only allowed between</p>
          <div style={S.windowBadge}>🕙 10:00 AM – 1:00 PM IST</div>
          <p style={S.sub}>Current time: <strong>{blockedInfo.currentIST}</strong></p>
          <button style={S.btn} onClick={() => { setMobileBlocked(false); setOtpStep(false); }}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ fontSize: 40, textAlign:'center', marginBottom: 16 }}>🔐</div>
          <h2 style={S.title}>Enter OTP</h2>
          <p style={S.sub}>We sent a 6-digit code to <strong>{maskedEmail}</strong></p>
          <input
            style={S.input}
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            value={otpCode}
            onChange={e => setOtpCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
          />
          <button style={S.btn} onClick={handleVerifyOtp} disabled={otpLoading}>
            {otpLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <div style={{ textAlign:'center', marginTop: 12 }}>
            <span style={{ fontSize:13, color:'#9ca3af' }}>Didn't receive it? </span>
            <button style={S.link} onClick={handleResendOtp}>Resend OTP</button>
          </div>
          <div style={{ textAlign:'center', marginTop: 8 }}>
            <button style={S.link} onClick={() => setOtpStep(false)}>← Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🐦 TweetApp</div>
        <h2 style={S.title}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

        {mode === 'register' && (
          <input style={S.input} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input style={S.input} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={S.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        {mode === 'register' && (
          <input style={S.input} type="tel" placeholder="Phone Number (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
        )}

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div style={{ textAlign:'center', marginTop:16, fontSize:14, color:'#6b7280' }}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button style={S.link} onClick={() => setMode('register')}>Sign up</button>
              <br />
              <a href="/forgot-password" style={{ ...S.link, display:'inline-block', marginTop:8 }}>Forgot password?</a>
            </>
          ) : (
            <>Already have an account? <button style={S.link} onClick={() => setMode('login')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', padding: 16 },
  card:       { background:'#fff', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:420, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' },
  logo:       { fontSize:26, fontWeight:800, color:'#1da1f2', textAlign:'center', marginBottom:8 },
  title:      { fontSize:22, fontWeight:700, color:'#1f2937', textAlign:'center', marginBottom:6 },
  sub:        { fontSize:14, color:'#6b7280', textAlign:'center', marginBottom:16 },
  input:      { width:'100%', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'12px 14px', fontSize:15, outline:'none', fontFamily:'inherit', marginBottom:12, display:'block' },
  btn:        { width:'100%', background:'linear-gradient(135deg,#1da1f2,#0d8ecf)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:4 },
  link:       { background:'none', border:'none', color:'#1da1f2', cursor:'pointer', fontWeight:600, fontSize:14 },
  windowBadge:{ background:'#fef3c7', color:'#92400e', borderRadius:10, padding:'12px 20px', textAlign:'center', margin:'12px 0', fontWeight:700, fontSize:16 },
};
