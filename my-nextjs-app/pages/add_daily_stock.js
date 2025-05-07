import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AddDailyStockPage() {
  const [timestamp, setTimestamp] = useState('');
  const [symbol, setSymbol] = useState('');
  const [open, setOpen] = useState('');
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const [close, setClose] = useState('');
  const [volume, setVolume] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAddDailyStock = async (e) => {
    e.preventDefault();
    if (!timestamp || !symbol || open === '' || high === '' || low === '' || close === '' || volume === '') {
      setMessage('Please fill in all fields.');
      return;
    }
    const pOpen = parseFloat(open),
          pHigh = parseFloat(high),
          pLow = parseFloat(low),
          pClose = parseFloat(close),
          pVol = parseInt(volume, 10);
    if ([pOpen, pHigh, pLow, pClose].some(isNaN) || isNaN(pVol)) {
      setMessage('Invalid number input.');
      return;
    }
    try {
      const res = await fetch('/api/add_daily_stock', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({timestamp, symbol, open:pOpen, high:pHigh, low:pLow, close:pClose, volume:pVol})
      });
      const data = await res.json();
      setMessage(res.ok 
        ? `✅ Added ${symbol} on ${timestamp}` 
        : `❌ ${data.error}`);
    } catch {
      setMessage('❌ Unexpected error.');
    }
  };

  const navItems = [
    ['Portfolio', '/portfolio'],
    ['Orders', '/transactions'],
    ['Create Portfolio', '/create_portfolio'],
    ['Stocks', '/stocks'],
    ['Friends', '/friends'],
    ['Create Stocklist', '/create_stock_list'],
    ['Stocklists', '/stock_lists'],
    ['Add Daily Stock', '/add_daily_stock'],
  ];

  return (
    <div style={styles.pageContainer}>
      <nav style={styles.sidebar}>
        <div>
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} passHref>
              <div style={styles.sideNavItem}>{label}</div>
            </Link>
          ))}
        </div>
        <button
          style={styles.logoutButton}
          onClick={() => { localStorage.clear(); router.push('/login'); }}
        >
          Log Out
        </button>
      </nav>

      <main style={styles.mainContent}>
        <h1 style={styles.mainHeader}>Add Daily Stock</h1>
        <form onSubmit={handleAddDailyStock} style={styles.form}>
          {[
            ['Timestamp', 'date', timestamp, setTimestamp],
            ['Symbol', 'text', symbol, setSymbol],
            ['Open', 'number', open, setOpen],
            ['High', 'number', high, setHigh],
            ['Low', 'number', low, setLow],
            ['Close', 'number', close, setClose],
            ['Volume', 'number', volume, setVolume],
          ].map(([lbl, type, val, fn]) => (
            <label key={lbl} style={styles.field}>
              <span style={styles.label}>{lbl}:</span>
              <input
                type={type}
                step={type==='number'?'any':undefined}
                value={val}
                onChange={e => fn(e.target.value)}
                style={styles.input}
              />
            </label>
          ))}

          <button type="submit" style={styles.submitButton}>
            Add Stock Data
          </button>
          {message && <p style={styles.message}>{message}</p>}
        </form>
      </main>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0b0b0b',
    color: '#fff',
    fontFamily: 'Helvetica, Arial, sans-serif',
  },

  sidebar: {
    width: '250px',
    backgroundColor: '#111',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1rem',
  },
  sideNavItem: {
    fontFamily: '"Playfair Display", cursive',
    padding: '0.75rem 0.5rem',
    borderBottom: '1px solid #333',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  logoutButton: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#d9534f',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontFamily: '"Playfair Display", cursive',
    cursor: 'pointer',
  },

  mainContent: {
    flexGrow: 1,
    padding: '2rem',
  },
  mainHeader: {
    fontFamily: '"Playfair Display", cursive',
    fontSize: '2.5rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },

  form: {
    maxWidth: '400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#111',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    fontFamily: '"Playfair Display", cursive',
    color: '#ccc',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#39d39f',
    color: '#fff',
    fontFamily: '"Playfair Display", cursive',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },

  message: {
    marginTop: '1rem',
    textAlign: 'center',
    color: '#39d39f',
    fontFamily: '"Playfair Display", cursive',
  },
};
