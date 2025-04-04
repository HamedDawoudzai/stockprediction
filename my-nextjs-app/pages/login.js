import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
          setMessage(`Logged in as ${username}. Redirecting...`);
          
          router.push('/portfolio');
        } else {
          setMessage(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Login error:', error);
        setMessage('An unexpected error occurred.');
      }
    } else {
      setMessage('Please enter both username and password.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to H&R Investments</h1>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            placeholder="Enter your username"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Enter your password"
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
    backgroundColor: '#111',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '40px',
    fontSize: '2rem',
  },
  formContainer: {
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px',
  },
  heading: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '1.5rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: '#333',
    color: '#fff',
  },
  button: {
    padding: '10px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  message: {
    marginTop: '15px',
    color: '#0f0',
    textAlign: 'center',
  },
  linkText: {
    marginTop: '15px',
    textAlign: 'center',
  },
  link: {
    color: '#39d39f',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};
