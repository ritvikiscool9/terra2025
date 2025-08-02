import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page as the first screen
    router.push('/login');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div>Redirecting to login...</div>
    </div>
  );
}