import { useState } from 'react';
import Link from 'next/link';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > 0) {
      const portfolio_id = localStorage.getItem('current_portfolio_id');
      if (!portfolio_id) {
        setMessage('No portfolio selected.');
        return;
      }

      try {
        const res = await fetch('/api/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio_id, amount: withdrawAmount }),
        });
        if (res.ok) {
          const cashRes = await fetch(`/api/cash_balance?portfolio_id=${portfolio_id}`);
          const totalRes = await fetch(`/api/total_balance?portfolio_id=${portfolio_id}`);
          if (cashRes.ok && totalRes.ok) {
            const cashData = await cashRes.json();
            const totalData = await totalRes.json();
            setMessage(
              `Successfully withdrew $${withdrawAmount}. New cash balance: $${cashData.cash_balance}. Total balance (cash + stocks): $${totalData.total_balance}`
            );
          } else {
            setMessage('Withdrawal succeeded, but error fetching balances.');
          }
        } else {
          const errData = await res.json();
          setMessage(`Error: ${errData.error}`);
        }
      } catch (err) {
        console.error('Withdraw error:', err);
        setMessage('An unexpected error occurred.');
      }
    } else {
      setMessage('Please enter an amount greater than 0.');
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.sideNav}>
        <Link href="/portfolio" passHref>
          <div style={styles.sideNavItem}>Portfolio</div>
        </Link>
        <Link href="/transactions" passHref>
          <div style={styles.sideNavItem}>Orders</div>
        </Link>
      </nav>

      <div style={styles.mainContent}>
        <h1 style={styles.heading}>Withdraw Funds</h1>
        <form onSubmit={handleWithdraw} style={styles.form}>
          <label style={styles.label}>Withdraw Amount (USD):</label>
          <input
            type="number"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Withdraw
          </button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    backgroundColor: '#111',
    minHeight: '100vh',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  sideNav: {
    width: '200px',
    backgroundColor: '#000',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sideNavItem: {
    padding: '10px',
    borderBottom: '1px solid #333',
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    padding: '20px',
  },
  heading: {
    fontSize: '1.5rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '400px',
  },
  label: {
    marginBottom: '5px',
  },
  input: {
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#222',
    color: '#fff',
  },
  button: {
    padding: '10px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  message: {
    marginTop: '20px',
    color: '#0f0',
  },
};
