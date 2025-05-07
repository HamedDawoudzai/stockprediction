// pages/default.js

import Link from 'next/link';
import Image from 'next/image';

export default function DefaultPage() {
  return (
    <div style={styles.container}>
      <div style={styles.logoWrapper}>
        <Image
          src="/hd-logo.png"
          alt="HD Investments Logo"
          width={200}
          height={80}
        />
      </div>

      <h1 style={styles.title}>Welcome to HD Investing</h1>

      <div style={styles.buttonGroup}>
        <Link href="/login">
          <button style={styles.button}>Login</button>
        </Link>
        <Link href="/signup">
          <button style={styles.button}>Sign Up</button>
        </Link>
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
  title: {
    color: '#fff',
    fontSize: '2.5rem',
    marginBottom: '40px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#39d39f',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
  },
};
