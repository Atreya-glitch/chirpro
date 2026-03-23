import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:64 }}>🐦</div>
      <h1 style={{ fontSize:24, fontWeight:700, color:'#1f2937' }}>Page Not Found</h1>
      <Link href="/" style={{ color:'#1da1f2', fontWeight:600, textDecoration:'none' }}>← Back to Home</Link>
    </div>
  );
}
