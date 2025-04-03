// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the login page immediately
    router.replace('/login');
  }, [router]);

  // Optionally, you can render a loading indicator here while redirecting
  return null;
}
