// pages/transfer.js
import { useState } from 'react';
import Link from 'next/link';

export default function TransferPage() {
  const [fromPortfolio, setFromPortfolio] = useState('');
  const [toPortfolio, setToPortfolio] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    const transferAmount = parseFloat(amount);

    if (!fromPortfolio || !toPortfolio) {
      setMessage('Please provide both "From" and "To" portfolio IDs.');
      return;
    }
    if (fromPortfolio === toPortfolio) {
      setMessage('From and To portfolio IDs must be different.');
      return;
    }
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage('Please enter a valid transfer amount greater than 0.');
      return;
    }

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_portfolio_id: fromPortfolio,
          to_portfolio_id: toPortfolio,
          amount: transferAmount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(
          `Transfer successful. New balances:\n` +
          `• ${fromPortfolio}: $${data.from_cash_balance}\n` +
          `• ${toPortfolio}: $${data.to_cash_balance}`
        );
      } else {
        const errData = await res.json();
        setMessage(`Transfer failed: ${errData.error}`);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setMessage('An unexpected error occurred.');
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
        <h1 style={styles.heading}>Transfer Funds</h1>
        <p>Where would you like to transfer?</p>

        <form onSubmit={handleTransfer} style={styles.form}>
          <label style={styles.label}>
            From (Portfolio ID):
            <input
              type="text"
              value={fromPortfolio}
              onChange={(e) => setFromPortfolio(e.target.value)}
              style={styles.input}
              placeholder="Source portfolio ID"
            />
          </label>

          <label style={styles.label}>
            To (Portfolio ID):
            <input
              type="text"
              value={toPortfolio}
              onChange={(e) => setToPortfolio(e.target.value)}
              style={styles.input}
              placeholder="Destination portfolio ID"
            />
          </label>

          <label style={styles.label}>
            Transfer Amount (USD):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
              placeholder="Enter amount"
            />
          </label>

          <button type="submit" style={styles.button}>
            Transfer
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
    fontWeight: 'bold',
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
    whiteSpace: 'pre-line',
  },
};
