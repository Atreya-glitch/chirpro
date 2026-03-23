'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { useNotifications } from '@/hooks/useNotifications';
import { detectKeywords } from '@/utils/notificationUtils';

const PLAN_COLORS = { free:'#6b7280', bronze:'#b45309', silver:'#4b5563', gold:'#d97706' };
const PLAN_ICONS  = { free:'🆓', bronze:'🥉', silver:'🥈', gold:'🥇' };

export default function DashboardPage() {
  const { user, getAuthHeaders, refreshUser, API_URL } = useAuth();
  const [tweets, setTweets]   = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const notifiedIds = useRef(new Set());

  const { permission, requestPermission, notifyIfKeyword, isGranted } =
    useNotifications(user?.notificationPreferences);

  useEffect(() => { if (user) fetchTweets(); }, [user]);

  useEffect(() => {
    if (!user?.notificationPreferences?.enabled) return;
    if (permission !== 'granted') return;
    tweets.forEach(t => {
      if (notifiedIds.current.has(t._id)) return;
      notifiedIds.current.add(t._id);
      notifyIfKeyword(t);
    });
  }, [tweets, permission, notifyIfKeyword, user?.notificationPreferences]);

  const fetchTweets = async () => {
    try {
      const res = await axios.get(`${API_URL}/tweets`, { headers: getAuthHeaders() });
      setTweets(res.data.tweets);
    } catch { toast.error('Failed to load tweets'); }
    finally { setFetching(false); }
  };

  const handlePost = async () => {
    if (!content.trim()) return toast.error('Write something first!');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/tweets`, { content }, { headers: getAuthHeaders() });
      const newTweet = res.data.tweet;
      setTweets(prev => [newTweet, ...prev]);
      setContent('');
      await refreshUser();
      const fired = notifyIfKeyword(newTweet);
      if (fired) {
        const { matchedKeywords } = detectKeywords(newTweet.content, user?.notificationPreferences?.keywords);
        toast(`🔔 Notification: ${matchedKeywords.map(k=>`#${k}`).join(', ')}`, { duration:3000 });
      }
      const rem = res.data.remainingTweets;
      toast.success(`Posted! ${rem !== 'Unlimited' ? `${rem} remaining` : 'Unlimited 🎉'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
      if (err.response?.status === 403) setTimeout(() => router.push('/plans'), 2000);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/tweets/${id}`, { headers: getAuthHeaders() });
      setTweets(prev => prev.filter(t => t._id !== id));
      await refreshUser();
      toast.success('Tweet deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const plan   = user?.subscription?.plan || 'free';
  const limit  = user?.tweetLimit;
  const count  = user?.tweetCount || 0;
  const prog   = limit === Infinity ? 100 : Math.min((count / limit) * 100, 100);
  const canPost = user ? (user.canPost !== undefined ? user.canPost : (limit === Infinity || count < limit)) : false;
  const notifOn = user?.notificationPreferences?.enabled;

  const highlightKeywords = (text) => {
    const kws = [...new Set(['cricket','science',...(user?.notificationPreferences?.keywords||[])])];
    const regex = new RegExp(`\\b(${kws.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\b`,'gi');
    const parts = text.split(regex);
    return parts.map((p,i) =>
      kws.some(k=>k.toLowerCase()===p.toLowerCase())
        ? <mark key={i} style={{background:'#fef08a',borderRadius:3,padding:'0 2px',fontWeight:700}}>{p}</mark>
        : p
    );
  };

  const sidebarExtra = (
    <>
      {limit !== Infinity && (
        <div style={{ paddingInline:4 }}>
          <div style={{ height:6, background:'#e5e7eb', borderRadius:10, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${prog}%`, background: prog>=100?'#ef4444':PLAN_COLORS[plan], borderRadius:10, transition:'width 0.3s' }} />
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>
            {limit-count<=0 ? 'Limit reached' : `${limit-count} tweet${limit-count!==1?'s':''} left`}
          </div>
        </div>
      )}
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10,
        background: notifOn&&isGranted ? '#f0fdf4':'#f9fafb',
        border:`1.5px solid ${notifOn&&isGranted?'#bbf7d0':'#e5e7eb'}`,
      }}>
        <span>{notifOn&&isGranted?'🔔':'🔕'}</span>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color: notifOn&&isGranted?'#166534':'#6b7280' }}>
            Notifications {notifOn&&isGranted?'ON':'OFF'}
          </div>
          {!isGranted && permission!=='unsupported' && (
            <div style={{ fontSize:11, color:'#1da1f2', cursor:'pointer', fontWeight:600 }} onClick={requestPermission}>
              Enable →
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (!user) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading...</div>;

  return (
    <div style={S.layout}>
      <Sidebar extra={sidebarExtra} />
      <main style={S.main}>
        {!isGranted && notifOn && permission!=='unsupported' && (
          <div style={S.banner}>
            <span style={{ fontSize:20 }}>🔔</span>
            <div style={{ flex:1 }}>
              <strong>Enable Browser Notifications</strong>
              <div style={{ fontSize:12, marginTop:2 }}>Get notified for <strong>#cricket</strong> and <strong>#science</strong> tweets.</div>
            </div>
            <button style={S.bannerBtn} onClick={requestPermission}>Enable Now</button>
          </div>
        )}

        <div style={S.composeBox}>
          <div style={{ display:'flex', gap:12 }}>
            <div style={S.cAvatar}>{user.name?.[0]?.toUpperCase()}</div>
            <textarea
              style={S.textarea}
              placeholder="What's happening? Try 'cricket' or 'science'!"
              value={content}
              onChange={e => setContent(e.target.value.slice(0,280))}
              rows={3}
            />
          </div>
          <div style={S.cFooter}>
            <span style={{ fontSize:13, color: content.length>260?'#ef4444':'#9ca3af' }}>{280-content.length} chars left</span>
            {content && (() => {
              const { matched, matchedKeywords } = detectKeywords(content, user?.notificationPreferences?.keywords);
              return matched ? <span style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>🔔 Will notify: {matchedKeywords.map(k=>`#${k}`).join(', ')}</span> : null;
            })()}
            <button
              style={{ ...S.postBtn, background: canPost?'#1da1f2':'#9ca3af', cursor: canPost?'pointer':'not-allowed' }}
              onClick={handlePost}
              disabled={loading||!canPost}
            >
              {loading ? 'Posting...' : canPost ? 'Tweet' : 'Limit Reached'}
            </button>
          </div>
          {!canPost && (
            <div style={S.limitWarn}>
              ⚠️ You've reached your {plan} plan limit.{' '}
              <span style={{ color:'#1da1f2', cursor:'pointer', fontWeight:600 }} onClick={() => router.push('/plans')}>Upgrade now →</span>
            </div>
          )}
        </div>

        {fetching ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:40 }}>Loading tweets...</div>
        ) : tweets.length === 0 ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:60, background:'#fff', borderRadius:14, border:'1.5px solid #e5e7eb' }}>No tweets yet 🚀</div>
        ) : tweets.map(t => {
          const { matched, matchedKeywords } = detectKeywords(t.content, user?.notificationPreferences?.keywords);
          return (
            <div key={t._id} style={{ ...S.tweet, borderColor: matched?'#fde68a':'#e5e7eb' }}>
              <div style={S.tweetAvatar}>{t.user?.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, color:'#1f2937' }}>{t.user?.name}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:PLAN_COLORS[t.user?.subscription?.plan||'free'] }}>
                    {PLAN_ICONS[t.user?.subscription?.plan||'free']} {t.user?.subscription?.plan||'free'}
                  </span>
                  {matched && <span style={S.kwBadge}>🔔 {matchedKeywords.map(k=>`#${k}`).join(' ')}</span>}
                  <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>{new Date(t.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p style={{ color:'#374151', fontSize:15, lineHeight:1.6, margin:'0 0 8px' }}>{highlightKeywords(t.content)}</p>
                {t.user?._id === user?.id && (
                  <button style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:12 }} onClick={() => handleDelete(t._id)}>
                    🗑 Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

const S = {
  layout:    { display:'flex', gap:24, maxWidth:1100, margin:'0 auto', padding:'24px 16px', minHeight:'100vh' },
  main:      { flex:1, display:'flex', flexDirection:'column', gap:14 },
  banner:    { display:'flex', alignItems:'center', gap:12, background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:12, padding:'14px 18px' },
  bannerBtn: { background:'#f59e0b', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 },
  composeBox:{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1.5px solid #e5e7eb' },
  cAvatar:   { width:42, height:42, borderRadius:'50%', background:'#1da1f2', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18, flexShrink:0 },
  textarea:  { flex:1, border:'none', outline:'none', fontSize:16, resize:'none', fontFamily:'inherit', color:'#1f2937' },
  cFooter:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:'1px solid #f3f4f6', gap:8 },
  postBtn:   { color:'#fff', border:'none', borderRadius:20, padding:'8px 24px', fontWeight:700, fontSize:14, flexShrink:0 },
  limitWarn: { background:'#fef3c7', borderRadius:8, padding:'10px 14px', marginTop:10, fontSize:13, color:'#92400e' },
  tweet:     { background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', border:'1.5px solid', display:'flex', gap:14 },
  tweetAvatar:{ width:40, height:40, borderRadius:'50%', background:'#e0f2fe', color:'#0369a1', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, flexShrink:0 },
  kwBadge:   { fontSize:11, fontWeight:700, background:'#fef9c3', color:'#854d0e', padding:'2px 8px', borderRadius:20, border:'1px solid #fde68a' },
};
