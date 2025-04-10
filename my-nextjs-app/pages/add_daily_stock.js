import { useState } from 'react';
import Link from 'next/link';

export default function AddDailyStockPage() {
  const [timestamp, setTimestamp] = useState('');
  const [symbol, setSymbol] = useState('');
  const [open, setOpen] = useState('');
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const [close, setClose] = useState('');
  const [volume, setVolume] = useState('');
  const [message, setMessage] = useState('');

  const handleAddDailyStock = async (e) => {
    e.preventDefault();
    
    // Basic validation: ensure none of the fields are empty.
    if (!timestamp || !symbol || open === '' || high === '' || low === '' || close === '' || volume === '') {
      setMessage('Please fill in all fields.');
      return;
    }

    // Parse numerical values.
    const parsedOpen = parseFloat(open);
    const parsedHigh = parseFloat(high);
    const parsedLow = parseFloat(low);
    const parsedClose = parseFloat(close);
    const parsedVolume = parseInt(volume, 10);

    if (
      isNaN(parsedOpen) ||
      isNaN(parsedHigh) ||
      isNaN(parsedLow) ||
      isNaN(parsedClose) ||
      isNaN(parsedVolume)
    ) {
      setMessage('Invalid input in numerical fields.');
      return;
    }
    
    try {
      const res = await fetch('/api/add_daily_stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp,
          symbol,
          open: parsedOpen,
          high: parsedHigh,
          low: parsedLow,
          close: parsedClose,
          volume: parsedVolume,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`Successfully added daily stock data for ${symbol} on ${timestamp}.`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding daily stock data:', error);
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
        <h1 style={styles.heading}>Add Daily Stock Data</h1>
        <form onSubmit={handleAddDailyStock} style={styles.form}>
          <label style={styles.label}>Timestamp:</label>
          <input
            type="date"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>Symbol:</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>Open:</label>
          <input
            type="number"
            step="any"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>High:</label>
          <input
            type="number"
            step="any"
            value={high}
            onChange={(e) => setHigh(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>Low:</label>
          <input
            type="number"
            step="any"
            value={low}
            onChange={(e) => setLow(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>Close:</label>
          <input
            type="number"
            step="any"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            style={styles.input}
          />
          
          <label style={styles.label}>Volume:</label>
          <input
            type="number"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={styles.input}
          />
          
          <button type="submit" style={styles.button}>
            Add Daily Stock Data
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
