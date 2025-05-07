import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const portfolio_id = localStorage.getItem('current_portfolio_id');
    if (!portfolio_id) {
      setError('No portfolio selected.');
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await fetch(`/api/transactions?portfolio_id=${portfolio_id}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch transactions.');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('An unexpected error occurred.');
      }
    };

    fetchTransactions();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={styles.container}>
      {/* Side Navigation */}
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
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </nav>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Transactions</h1>
            <p style={styles.subheading}>Transaction history for your portfolio</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/deposit" passHref><button style={styles.whiteButton}>Deposit</button></Link>
            <Link href="/transfer" passHref><button style={styles.whiteButton}>Transfer</button></Link>
          </div>
        </header>

        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>Transaction History</h2>
          {error ? (
            <p style={styles.error}>{error}</p>
          ) : transactions.length === 0 ? (
            <p style={styles.noTransactions}>No transactions found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Type</th>
                  <th style={styles.tableHeaderCell}>Symbol</th>
                  <th style={styles.tableHeaderCell}>Shares</th>
                  <th style={styles.tableHeaderCell}>Price</th>
                  <th style={styles.tableHeaderCell}>Amount</th>
                  <th style={styles.tableHeaderCell}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td style={styles.tableCell}>{tx.transaction_type}</td>
                    <td style={styles.tableCell}>{tx.symbol || '-'}</td>
                    <td style={styles.tableCell}>{tx.shares && tx.shares > 0 ? tx.shares : '-'}</td>
                    <td style={styles.tableCell}>{tx.price && tx.price > 0 ? `$${tx.price}` : '-'}</td>
                    <td style={styles.tableCell}>${tx.amount}</td>
                    <td style={styles.tableCell}>{new Date(tx.transaction_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0b0b0b',
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
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
    flexGrow: 1,
    padding: '3rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  heading: {
    fontSize: '2rem',
    fontFamily: '"Times New Roman", serif',
  },
  subheading: {
    color: '#39d39f',
    marginTop: '4px',
  },
  section: {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  sectionHeading: {
    marginTop: 0,
    marginBottom: '1rem',
    fontFamily: '"Times New Roman", serif',
    fontSize: '1.5rem',
},
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderCell: {
    border: '1px solid #333',
    padding: '12px',
    textAlign: 'center',
    fontFamily: '"Times New Roman", serif',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  tableCell: {
    border: '1px solid #333',
    padding: '12px',
    textAlign: 'center',
    fontFamily: '"Times New Roman", serif',
    fontSize: '1rem',
  },
  whiteButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontFamily: '"Playfair Display", cursive',
  },
  noTransactions: {
    color: '#aaa',
    fontFamily: '"Playfair Display", cursive',
  },
};
