import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreatePortfolioPage() {
  const [portfolioName, setPortfolioName] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user_id');
    if (storedUser) {
      setCurrentUser(storedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portfolioName) {
      setMessage('❗ Please enter a portfolio name.');
      return;
    }
    if (!currentUser) {
      setMessage('❗ User not logged in. Please log in.');
      return;
    }

    try {
      const res = await fetch('/api/create_portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioName, user: currentUser }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Portfolio created successfully!');
        router.push('/portfolio');
      } else {
        setMessage(`❗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setMessage('❗ An unexpected error occurred.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create Portfolio</h1>
      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Portfolio Name</label>
          <input
            type="text"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            style={styles.input}
            placeholder="Enter portfolio name"
          />
          <button type="submit" style={styles.button}>Create Portfolio</button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0b0b0b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '40px',
    fontSize: '2.4rem',
    fontFamily: '"Times New Roman", serif',
  },
  formContainer: {
    backgroundColor: '#111',
    padding: '30px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    fontFamily: '"Playfair Display", cursive',
    fontSize: '1rem',
  },
  input: {
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
    boxSizing: 'border-box',
    width: '100%',
  },
  button: {
    padding: '12px',
    backgroundColor: '#39d39f',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  message: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#111',
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: '1rem',
    whiteSpace: 'pre-line',
  },
};
