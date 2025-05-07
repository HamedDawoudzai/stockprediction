// pages/login.js

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username && password) {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('user_id', data.user.user_id);
          router.push('/portfolio');
        } else {
          setMessage(`Error: ${data.error}`);
        }
      } catch {
        setMessage('An unexpected error occurred.');
      }
    } else {
      setMessage('Please enter both username and password.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Logo above everything */}
      <div style={styles.logoWrapper}>
        <Image
          src="/hd-logo.png"
          alt="HD Investments"
          width={200}
          height={80}
        />
      </div>

      {/* Login card */}
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to HD Investments</h1>
        <h2 style={styles.subtitle}>Login</h2>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Password"
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        <p style={styles.linkText}>
          Don’t have an account?{' '}
          <Link href="/signup" passHref>
            <span style={styles.link}>Sign Up</span>
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  logoWrapper: {
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#111',
    padding: '40px 30px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: '2.5rem',
    marginBottom: '10px',
    // inherits cursive font from globals.css
  },
  subtitle: {
    color: '#999',
    fontSize: '1.5rem',
    marginBottom: '30px',
    // inherits cursive font from globals.css
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#39d39f',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
  message: {
    marginTop: '20px',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: '25px',
    color: '#aaa',
    fontSize: '0.95rem',
  },
  link: {
    color: '#39d39f',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
