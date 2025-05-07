import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

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
  const [notification, setNotification] = useState(null); 
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

  const handleBuy = (stock) => {
    setBuyStock(stock);
    setBuyDollarAmount('');
    setShowBuyModal(true);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleConfirmBuy = async () => {
    const amount = parseFloat(buyDollarAmount);
    if (amount && !isNaN(amount) && amount > 0) {
      const calculatedShares = parseFloat((amount / buyStock.Close).toFixed(2));
      const portfolioId = localStorage.getItem('current_portfolio_id');

      if (!portfolioId) {
        showNotification('No portfolio selected. Please create or select a portfolio.', 'error');
        setShowBuyModal(false);
        return;
      }

      try {
        const res = await fetch('/api/buy_button', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            symbol: buyStock.Symbol,
            amount,
            price: buyStock.Close,
            calculatedShares,
          }),
        });
        if (res.ok) {
          showNotification(`✅ Purchase successful: $${amount} -> ~${calculatedShares} shares of ${buyStock.Symbol}.`, 'success');
        } else {
          const errData = await res.json();
          showNotification(`❗ Purchase denied: ${errData.error}`, 'error');
        }
      } catch (err) {
        console.error('Error during purchase:', err);
        showNotification('❗ An error occurred during purchase.', 'error');
      }
      setShowBuyModal(false);
    } else {
      showNotification('❗ Please enter a valid dollar amount.', 'error');
    }
  };

  const handleCancelBuy = () => {
    setShowBuyModal(false);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
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

      {/* Main Content */}
      <main style={styles.mainContent}>
        <h1 style={styles.heading}>Stocks Information</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {stocks.length === 0 ? (
          <p>No stock data available.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Symbol</th>
                <th style={styles.tableHeaderCell}>Open</th>
                <th style={styles.tableHeaderCell}>High</th>
                <th style={styles.tableHeaderCell}>Low</th>
                <th style={styles.tableHeaderCell}>Close</th>
                <th style={styles.tableHeaderCell}>Volume</th>
                <th style={styles.tableHeaderCell}>Date</th>
                <th style={styles.tableHeaderCell}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{stock.Symbol}</td>
                  <td style={styles.tableCell}>{stock.Open}</td>
                  <td style={styles.tableCell}>{stock.High}</td>
                  <td style={styles.tableCell}>{stock.Low}</td>
                  <td style={styles.tableCell}>{stock.Close}</td>
                  <td style={styles.tableCell}>{stock.Volume}</td>
                  <td style={styles.tableCell}>{formatDate(stock.Timestamp)}</td>
                  <td style={styles.tableCell}>
                    <button onClick={() => handleBuy(stock)} style={styles.buyButton}>Buy</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Buy Modal */}
      {showBuyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Buy shares of {buyStock?.Symbol}</h2>
            <p>How much would you like to buy?</p>
            <p>Close Price: ${buyStock?.Close}</p>
            <label>
              Dollar Amount:
              <input
                type="number"
                value={buyDollarAmount}
                onChange={(e) => setBuyDollarAmount(e.target.value)}
                style={styles.input}
              />
            </label>
            <div style={styles.modalButtons}>
              <button onClick={handleConfirmBuy} style={styles.buyButton}>Confirm</button>
              <button onClick={handleCancelBuy} style={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div style={styles.notification(notification.type)}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0b0b0b',
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
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
  },
  mainContent: {
    flexGrow: 1,
    padding: '3rem',
  },
  heading: {
    fontSize: '2rem',
    fontFamily: '"Times New Roman", serif',
    marginBottom: '20px',
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
  },
  tableCell: {
    border: '1px solid #333',
    padding: '12px',
    textAlign: 'center',
    fontFamily: '"Times New Roman", serif',
  },
  buyButton: {
    backgroundColor: '#39d39f',
    color: '#fff',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#444',
    color: '#fff',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#222',
    color: '#fff',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    textAlign: 'center',
    fontFamily: '"Times New Roman", serif',
  },
  modalButtons: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-around',
  },
  input: {
    marginTop: '10px',
    padding: '10px',
    width: '90%',
    borderRadius: '4px',
    border: '1px solid #444',
    backgroundColor: '#111',
    color: '#fff',
  },
  notification: (type) => ({
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
    color: '#fff',
    padding: '15px 30px',
    borderRadius: '25px',
    fontSize: '1rem',
    zIndex: 1100,
    fontFamily: '"Times New Roman", serif',
  }),
};
