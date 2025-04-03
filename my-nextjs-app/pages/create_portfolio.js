import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreatePortfolioPage() {
  const [portfolioName, setPortfolioName] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  // On component mount, retrieve the user id from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user_id');
    if (storedUser) {
      setCurrentUser(storedUser);
    } else {
      // If not logged in, redirect to login page
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portfolioName) {
      setMessage('Please enter a portfolio name.');
      return;
    }
    if (!currentUser) {
      setMessage('User not logged in. Please log in.');
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
        setMessage('Portfolio created successfully!');
        // Optionally, redirect to the portfolio page.
        router.push('/portfolio');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to H&R Investments</h1>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Create Portfolio</h2>
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
};
