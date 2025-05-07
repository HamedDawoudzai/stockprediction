// pages/create_stock_list.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreateStockListPage() {
  const [stockListTitle, setStockListTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockShares, setNewStockShares] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user_id');
    if (storedUser) setCurrentUser(storedUser);
    else router.push('/login');
  }, [router]);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch('/api/stocks_for_adding');
        if (res.ok) {
          const stocks = await res.json();
          setAvailableStocks(stocks);
          if (stocks.length) setNewStockSymbol(stocks[0].symbol);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchStocks();
  }, []);

  const handleAddStock = (e) => {
    e.preventDefault();
    if (!newStockSymbol || !newStockShares || isNaN(newStockShares)) {
      setMessage('Please select a stock and enter a valid number of shares.');
      return;
    }
    setStockEntries([
      ...stockEntries,
      { symbol: newStockSymbol, shares: parseFloat(newStockShares) },
    ]);
    setNewStockShares('');
    setMessage('');
  };

  const handleRemoveEntry = (i) => {
    setStockEntries(stockEntries.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stockListTitle) {
      setMessage('Please enter a stock list title.');
      return;
    }
    if (!currentUser) {
      setMessage('User not logged in. Please log in.');
      return;
    }
    try {
      const res = await fetch('/api/create_stock_list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stockListTitle,
          description,
          visibility,
          user: currentUser,
          stocks: stockEntries,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Stock list created successfully!');
        router.push('/stock_lists');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Stock List</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={stockListTitle}
            onChange={(e) => setStockListTitle(e.target.value)}
            style={styles.input}
            placeholder="Stock List Title"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            placeholder="Description"
            rows="4"
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={styles.input}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>

          <hr style={styles.separator} />

          <h2 style={styles.subheading}>Add Stocks</h2>

          <div style={styles.field}>
            <label style={styles.label}>Select Stock</label>
            <select
              value={newStockSymbol}
              onChange={(e) => setNewStockSymbol(e.target.value)}
              style={styles.input}
            >
              {availableStocks.length ? (
                availableStocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} (Close: ${s.price})
                  </option>
                ))
              ) : (
                <option>No stocks available</option>
              )}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Number of Shares</label>
            <input
              type="number"
              value={newStockShares}
              onChange={(e) => setNewStockShares(e.target.value)}
              style={styles.input}
              placeholder="Shares"
            />
          </div>

          <button type="button" onClick={handleAddStock} style={styles.button}>
            Add Stock
          </button>

          {stockEntries.length > 0 && (
            <ul style={styles.stockList}>
              {stockEntries.map((ent, i) => (
                <li key={i} style={styles.stockItem}>
                  {ent.symbol} — {ent.shares} shares{' '}
                  <button
                    onClick={() => handleRemoveEntry(i)}
                    style={styles.remove}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button type="submit" style={styles.button}>
            Create Stock List
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        <button style={styles.back} onClick={() => router.back()}>
          Back
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#111',
    padding: '40px 30px',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: '2rem',
    marginBottom: 20,
    fontFamily: '"Playfair Display", cursive',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #333',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  },
  textarea: {
    padding: 12,
    borderRadius: 8,
    border: '1px solid #333',
    backgroundColor: '#222',
    color: '#fff',
    fontSize: '1rem',
    resize: 'vertical',
  },
  separator: {
    border: 0,
    borderTop: '1px solid #444',
    margin: '20px 0',
  },
  subheading: {
    color: '#ccc',
    fontSize: '1.2rem',
    fontFamily: '"Playfair Display", cursive',
    marginBottom: 10,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  label: {
    marginBottom: 5,
    color: '#ddd',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#39d39f',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 'bold',
    fontFamily: '"Playfair Display", cursive',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%',
  },
  stockList: {
    listStyle: 'none',
    paddingLeft: 0,
    textAlign: 'left',
    marginTop: 15,
    fontFamily: 'Times New Roman, serif',
  },
  stockItem: {
    marginBottom: 8,
  },
  remove: {
    background: 'none',
    border: 'none',
    color: '#f00',
    cursor: 'pointer',
    marginLeft: 10,
  },
  message: {
    marginTop: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  back: {
    marginTop: 15,
    backgroundColor: '#555',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '1rem',
    width: '100%',
  },
};
