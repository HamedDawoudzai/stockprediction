import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !password || !firstName || !lastName) {
      setMessage('Please fill in all fields.');
      return;
    }
    
    const payload = { username, password, firstName, lastName };
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`User created successfully: ${data.user.user_id}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to H&R Investments</h1>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Sign Up</h2>
        <form onSubmit={handleSignup} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            placeholder="Choose a username"
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Create a password"
          />
          <label style={styles.label}>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={styles.input}
            placeholder="Your first name"
          />
          <label style={styles.label}>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={styles.input}
            placeholder="Your last name"
          />
          <button type="submit" style={styles.button}>
            Sign Up
          </button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
        <p style={styles.linkText}>
          Already have an account?{' '}
          <Link href="/login" passHref>
            <span style={styles.link}>Log In</span>
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
