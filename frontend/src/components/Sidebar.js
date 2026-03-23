'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PLAN_COLORS = { free:'#6b7280', bronze:'#b45309', silver:'#4b5563', gold:'#d97706' };
const PLAN_ICONS  = { free:'🆓', bronze:'🥉', silver:'🥈', gold:'🥇' };

export default function Sidebar({ extra }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const plan = user?.subscription?.plan || 'free';

  return (
    <aside style={S.sidebar}>
      <div style={S.logo}>🐦 TweetApp</div>
      <div style={S.userCard}>
        <div style={S.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <div style={S.userName}>{user?.name}</div>
          <div style={S.userEmail}>{user?.email}</div>
        </div>
      </div>
      <div style={{ ...S.planBadge, borderColor: PLAN_COLORS[plan] }}>
        <span style={{ fontSize:20 }}>{PLAN_ICONS[plan]}</span>
        <div>
          <div style={{ fontWeight:700, color:PLAN_COLORS[plan], fontSize:14, textTransform:'capitalize' }}>{plan} Plan</div>
          <div style={{ fontSize:11, color:'#6b7280' }}>
            {user?.tweetLimit === Infinity ? 'Unlimited tweets' : `${user?.tweetCount||0} / ${user?.tweetLimit} used`}
          </div>
        </div>
      </div>
      {extra}
      <NavBtn icon="🏠" label="Text Feed"     onClick={() => router.push('/dashboard')} />
      <NavBtn icon="🎙️" label="Audio Tweets"  onClick={() => router.push('/audio-tweets')} />
      <NavBtn icon="⚡" label="Upgrade Plan"  onClick={() => router.push('/plans')} color="#1da1f2" />
      <NavBtn icon="👤" label="Profile"        onClick={() => router.push('/profile')} />
      <NavBtn icon="🔒" label="Login History" onClick={() => router.push('/login-history')} />
      <NavBtn icon="←"  label="Sign Out"      onClick={logout} muted />
    </aside>
  );
}

function NavBtn({ icon, label, onClick, color, muted }) {
  return (
    <button
      style={{
        ...S.navBtn,
        color: muted ? '#9ca3af' : color || '#374151',
        background: muted ? '#f3f4f6' : '#f9fafb',
      }}
      onClick={onClick}
    >
      {icon} {label}
    </button>
  );
}

const S = {
  sidebar:  { width:240, flexShrink:0, display:'flex', flexDirection:'column', gap:10 },
  logo:     { fontSize:22, fontWeight:800, color:'#1da1f2' },
  userCard: { display:'flex', alignItems:'center', gap:10, background:'#f9fafb', borderRadius:12, padding:'12px 14px' },
  avatar:   { width:40, height:40, borderRadius:'50%', background:'#1da1f2', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:17, flexShrink:0 },
  userName: { fontWeight:700, color:'#1f2937', fontSize:14 },
  userEmail:{ fontSize:11, color:'#9ca3af' },
  planBadge:{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'2px solid', borderRadius:12, padding:'10px 14px' },
  navBtn:   { border:'none', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left', width:'100%' },
};
