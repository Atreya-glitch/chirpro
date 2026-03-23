'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthPage from '@/components/AuthPage';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (user) return null;
  return <AuthPage />;
}

function LoadingScreen() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#1da1f2', fontSize:18 }}>
      Loading...
    </div>
  );
}
