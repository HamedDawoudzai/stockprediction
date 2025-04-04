import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Helper function to format Timestamp as DD-MM-YYYY
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStock, setBuyStock] = useState(null);
  const [buyDollarAmount, setBuyDollarAmount] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/stocks');
        if (res.ok) {
          const data = await res.json();
          setStocks(data);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch stocks data.');
        }
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('An unexpected error occurred.');
      }
    };
    fetchStocks();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // When user clicks Buy, open the modal for that specific stock.
  const handleBuy = (stock) => {
    setBuyStock(stock);
    setBuyDollarAmount('');
    setShowBuyModal(true);
  };

  const handleConfirmBuy = () => {
    const amount = parseFloat(buyDollarAmount);
    if (amount && !isNaN(amount) && amount > 0) {
      const calculatedShares = (amount / buyStock.Close).toFixed(2);
      console.log(
        `User wants to spend $${amount} to buy ${calculatedShares} shares of ${buyStock.Symbol} at $${buyStock.Close}`
      );
      alert(
        `You are spending $${amount} to buy approximately ${calculatedShares} shares of ${buyStock.Symbol} at $${buyStock.Close} per share.`
      );
      setShowBuyModal(false);
    } else {
      alert('Please enter a valid dollar amount.');
    }
  };

  const handleCancelBuy = () => {
    setShowBuyModal(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#0b0b0b',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Sidebar Navigation */}
      <nav
        style={{
          width: '250px',
          backgroundColor: '#111',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Link href="/portfolio" passHref>
            <div style={styles.sideNavItem}>Portfolio</div>
          </Link>
          <Link href="/transactions" passHref>
            <div style={styles.sideNavItem}>Orders</div>
          </Link>
          <Link href="/create_portfolio" passHref>
            <div style={styles.sideNavItem}>Create Portfolio</div>
          </Link>
          {/* Stocks option intentionally removed */}
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Stocks Information</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {stocks.length === 0 ? (
          <p>No stock data available.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cellStyle}>Symbol</th>
                <th style={cellStyle}>Open</th>
                <th style={cellStyle}>High</th>
                <th style={cellStyle}>Low</th>
                <th style={cellStyle}>Close</th>
                <th style={cellStyle}>Volume</th>
                <th style={cellStyle}>Timestamp</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={index}>
                  <td style={cellStyle}>{stock.Symbol}</td>
                  <td style={cellStyle}>{stock.Open}</td>
                  <td style={cellStyle}>{stock.High}</td>
                  <td style={cellStyle}>{stock.Low}</td>
                  <td style={cellStyle}>{stock.Close}</td>
                  <td style={cellStyle}>{stock.Volume}</td>
                  <td style={cellStyle}>{formatDate(stock.Timestamp)}</td>
                  <td style={cellStyle}>
                    <button onClick={() => handleBuy(stock)} style={styles.buyButton}>
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* In-app Modal for Buying Shares */}
      {showBuyModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '10px' }}>
              Buy shares of {buyStock?.Symbol}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              How many dollars would you like to spend?
            </p>
            <p style={{ marginBottom: '20px' }}>Close Price: ${buyStock?.Close}</p>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Dollar Amount:
              <input
                type="number"
                value={buyDollarAmount}
                onChange={(e) => setBuyDollarAmount(e.target.value)}
                style={inputStyle}
              />
            </label>
            <div style={modalButtonsStyle}>
              <button onClick={handleConfirmBuy} style={styles.buyButton}>
                Confirm
              </button>
              <button onClick={handleCancelBuy} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cellStyle = {
  border: '1px solid #333',
  padding: '8px',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)', // lighter overlay
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: '#222', // dark gray background
  color: '#fff',
  borderRadius: '8px',
  padding: '30px',
  width: '400px', // increased width for better readability
  textAlign: 'center',
  fontFamily: 'Times New Roman, serif', // change font to Times New Roman
};

const modalButtonsStyle = {
  marginTop: '20px',
  display: 'flex',
  justifyContent: 'space-around',
};

const inputStyle = {
  marginTop: '10px',
  padding: '8px',
  width: '90%',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const styles = {
  sideNavItem: {
    cursor: 'pointer',
    padding: '10px',
    borderBottom: '1px solid #333',
  },
  logoutButton: {
    backgroundColor: 'red',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: 'auto',
  },
  buyButton: {
    backgroundColor: 'green',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    color: '#000',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
