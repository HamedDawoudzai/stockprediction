import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

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
              `✅ Successfully withdrew $${withdrawAmount}. New cash balance: $${cashData.cash_balance}. Total balance (cash + stocks): $${totalData.total_balance}`
            );
          } else {
            setMessage('✅ Withdrawal succeeded, but error fetching balances.');
          }
        } else {
          const errData = await res.json();
          setMessage(`❗ Error: ${errData.error}`);
        }
      } catch (err) {
        console.error('Withdraw error:', err);
        setMessage('❗ An unexpected error occurred.');
      }
    } else {
      setMessage('❗ Please enter an amount greater than 0.');
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
          <button type="submit" style={styles.button}>Withdraw</button>
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
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: 'auto',
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
  },
  label: {
    fontSize: '1rem',
    marginBottom: '5px',
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #444',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
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
    color: '#4CAF50',
    backgroundColor: '#111',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '1rem',
  },
};
