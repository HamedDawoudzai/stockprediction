// pages/create_stock_list.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreateStockListPage() {
  const [stockListTitle, setStockListTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private'); // default visibility
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [stockEntries, setStockEntries] = useState([]); // Each entry: { symbol, shares }
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockShares, setNewStockShares] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user_id');
    if (storedUser) {
      setCurrentUser(storedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Fetch available stocks from the new endpoint: /api/stocks_for_adding
    async function fetchStocks() {
      try {
        const res = await fetch('/api/stocks_for_adding');
        if (res.ok) {
          const stocks = await res.json();
          console.log('Fetched stocks:', stocks); // Debug: check the fetched stocks in the console
          setAvailableStocks(stocks);
          if (stocks.length > 0) {
            setNewStockSymbol(stocks[0].symbol);
          }
        } else {
          console.error('Error fetching stocks: ', res.statusText);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    }
    fetchStocks();
  }, []);

  // Handler to add a new stock entry to the list.
  const handleAddStock = (e) => {
    e.preventDefault();
    if (!newStockSymbol || !newStockShares || isNaN(newStockShares)) {
      setMessage('Please select a stock and enter a valid number of shares.');
      return;
    }
    setStockEntries([...stockEntries, { symbol: newStockSymbol, shares: parseFloat(newStockShares) }]);
    setNewStockShares('');
    setMessage('');
  };

  const handleRemoveEntry = (index) => {
    const updatedEntries = stockEntries.filter((_, i) => i !== index);
    setStockEntries(updatedEntries);
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
          stocks: stockEntries,  // Array of stock entries { symbol, shares }
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Stock list created successfully!');
        router.push('/stock_lists');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating stock list:', error);
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to H&R Investments</h1>
      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Create Stock List</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Stock List Title</label>
          <input
            type="text"
            value={stockListTitle}
            onChange={(e) => setStockListTitle(e.target.value)}
            style={styles.input}
            placeholder="Enter stock list title"
          />
          <label style={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            placeholder="Enter a description for your stock list"
            rows="4"
          />
          <label style={styles.label}>Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={styles.input}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>

          {/* Section for adding stocks to the stock list */}
          <div style={{ margin: '20px 0', borderTop: '1px solid #444', paddingTop: '15px' }}>
            <h3 style={{ marginBottom: '10px' }}>Add Stocks</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={styles.label}>Select Stock</label>
              <select
                value={newStockSymbol}
                onChange={(e) => setNewStockSymbol(e.target.value)}
                style={styles.input}
              >
                {availableStocks && availableStocks.length > 0 ? (
                  availableStocks.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} (Close Price: ${stock.price})
                    </option>
                  ))
                ) : (
                  <option value="">No stocks available</option>
                )}
              </select>
              <label style={styles.label}>Number of Shares</label>
              <input
                type="number"
                value={newStockShares}
                onChange={(e) => setNewStockShares(e.target.value)}
                style={styles.input}
                placeholder="Enter number of shares"
              />
              <button onClick={handleAddStock} style={styles.button}>
                Add Stock
              </button>
            </div>
            {/* List the added stock entries */}
            {stockEntries.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <h4>Stocks in List:</h4>
                <ul>
                  {stockEntries.map((entry, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      {entry.symbol} - {entry.shares} shares&nbsp;
                      <button
                        onClick={() => handleRemoveEntry(index)}
                        style={{ background: 'none', color: '#f00', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button type="submit" style={styles.button}>
            Create Stock List
          </button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
        {/* Back Button */}
        <button style={styles.backButton} onClick={() => router.back()}>
          Back
        </button>
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
    maxWidth: '500px',
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
  textarea: {
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: '#333',
    color: '#fff',
    resize: 'vertical',
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
  backButton: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#555',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
  },
};
