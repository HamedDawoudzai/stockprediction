import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function TransferPage() {
  const [fromPortfolio, setFromPortfolio] = useState('');
  const [toPortfolio, setToPortfolio] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleTransfer = async (e) => {
    e.preventDefault();
    const transferAmount = parseFloat(amount);

    if (!fromPortfolio || !toPortfolio) {
      setMessage('❗ Please provide both "From" and "To" portfolio IDs.');
      return;
    }
    if (fromPortfolio === toPortfolio) {
      setMessage('❗ From and To portfolio IDs must be different.');
      return;
    }
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage('❗ Please enter a valid transfer amount greater than 0.');
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
          `✅ Transfer successful. New balances:\n• ${fromPortfolio}: $${data.from_cash_balance}\n• ${toPortfolio}: $${data.to_cash_balance}`
        );
      } else {
        const errData = await res.json();
        setMessage(`❗ Transfer failed: ${errData.error}`);
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setMessage('❗ An unexpected error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.sideNav}>
        <div>
          <Link href="/portfolio" passHref><div style={styles.sideNavItem}>Portfolio</div></Link>
          <Link href="/transactions" passHref><div style={styles.sideNavItem}>Orders</div></Link>
          <Link href="/create_portfolio" passHref><div style={styles.sideNavItem}>Create Portfolio</div></Link>
          <Link href="/stocks" passHref><div style={styles.sideNavItem}>Stocks</div></Link>
          <Link href="/friends" passHref><div style={styles.sideNavItem}>Friends</div></Link>
          <Link href="/create_stock_list" passHref><div style={styles.sideNavItem}>Create stocklist</div></Link>
          <Link href="/stock_lists" passHref><div style={styles.sideNavItem}>Stocklists</div></Link>
          <Link href="/add_daily_stock" passHref><div style={styles.sideNavItem}>Add daily stock</div></Link>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>Log Out</button>
      </nav>

      <div style={styles.mainContent}>
        <h1 style={styles.heading}>Transfer Funds</h1>
        <p style={{ marginBottom: '20px' }}>Where would you like to transfer?</p>

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

          <button type="submit" style={styles.button}>Transfer</button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    backgroundColor: '#0b0b0b',
    minHeight: '100vh',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  sideNav: {
    width: '250px',
    backgroundColor: '#000',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sideNavItem: {
    cursor: 'pointer',
    padding: '12px',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontFamily: '"Playfair Display", cursive',
    fontSize: '1.1rem',
    transition: 'background-color 0.2s',
  },
  logoutButton: {
    backgroundColor: 'red',
    color: '#fff',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: 'auto',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  mainContent: {
    flex: 1,
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '30px',
    fontFamily: '"Times New Roman", serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#111',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    fontFamily: '"Playfair Display", cursive', // << added this to make all inside cursive
  },
  
  label: {
    fontSize: '1rem',
    fontFamily: '"Playfair Display", cursive',  // << added this
  },
  
  input: {
    padding: '14px 16px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: '"Playfair Display", cursive',  // << added this
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
    fontFamily: '"Playfair Display", cursive',  // << added this
  },
  
  message: {
    marginTop: '20px',
    backgroundColor: '#111',
    padding: '12px 20px',
    borderRadius: '8px',
    color: '#4CAF50',
    whiteSpace: 'pre-line',
    fontSize: '1rem',
  },
};
