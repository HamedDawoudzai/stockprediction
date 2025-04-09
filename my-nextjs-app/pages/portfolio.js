import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

let debounceTimer = null;

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [totalBalance, setTotalBalance] = useState(null);
  const [cashBalance, setCashBalance] = useState(null);
  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStock, setBuyStock] = useState(null);
  const [buyDollarAmount, setBuyDollarAmount] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellStock, setSellStock] = useState(null);
  const [sellDollarAmount, setSellDollarAmount] = useState('');
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const refreshTotalBalance = async () => {
    try {
      const res = await fetch(`/api/total_balance?portfolio_id=${selectedPortfolioId}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setTotalBalance(data.total_balance);
      } else {
        const errData = await res.json();
        setError(errData.error);
        setTotalBalance(null);
      }
    } catch (err) {
      console.error('Error fetching total balance:', err);
      setError('An unexpected error occurred.');
      setTotalBalance(null);
    }
  };

  const refreshCashBalance = async () => {
    try {
      const res = await fetch(`/api/cash_balance?portfolio_id=${selectedPortfolioId}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setCashBalance(data.cash_balance);
      } else {
        const errData = await res.json();
        setError(errData.error);
        setCashBalance(null);
      }
    } catch (err) {
      console.error('Error fetching cash balance:', err);
      setError('An unexpected error occurred.');
      setCashBalance(null);
    }
  };

  const refreshPortfolioStocks = async () => {
    try {
      const res = await fetch(`/api/portfolio_stocks?portfolio_id=${selectedPortfolioId}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioStocks(data);
      } else {
        const errData = await res.json();
        setError(errData.error);
        setPortfolioStocks([]);
      }
    } catch (err) {
      console.error('Error fetching portfolio stocks:', err);
      setError('An unexpected error occurred.');
      setPortfolioStocks([]);
    }
  };

  const refreshPortfolioData = () => {
    refreshTotalBalance();
    refreshCashBalance();
    refreshPortfolioStocks();
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('user_id');
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const fetchPortfolios = async () => {
      try {
        const res = await fetch(`/api/portfolios?user=${currentUser}`);
        if (res.ok) {
          const data = await res.json();
          setPortfolios(data);
          if (data.length > 0) {
            const savedPortfolioId = localStorage.getItem('current_portfolio_id');
            const matchedPortfolio = data.find(p => p.portfolio_id === savedPortfolioId);
            const initialPortfolio = matchedPortfolio || data[0];

            setSelectedPortfolioId(initialPortfolio.portfolio_id);
            localStorage.setItem('current_portfolio_id', initialPortfolio.portfolio_id);
          }
        } else {
          const errData = await res.json();
          setError(errData.error);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('An unexpected error occurred.');
      }
    };

    fetchPortfolios();
  }, [router]);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    refreshPortfolioData();
  }, [selectedPortfolioId]);

  const handlePortfolioChange = (e) => {
    const newPortfolioId = e.target.value.trim();
    localStorage.setItem('current_portfolio_id', newPortfolioId);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const isValid = portfolios.some(p => p.portfolio_id === newPortfolioId);
      if (isValid) {
        setSelectedPortfolioId(newPortfolioId);
        setError('');
      } else {
        setError('Invalid portfolio selected.');
      }
    }, 100);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const totalStockValue = portfolioStocks.reduce(
    (acc, stock) => acc + Number(stock.value),
    0
  ).toFixed(2);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleBuy = (stock) => {
    const price = stock.shares > 0 ? Number((stock.value / stock.shares).toFixed(2)) : 0;
    setBuyStock({ ...stock, Close: price });
    setBuyDollarAmount('');
    setShowBuyModal(true);
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
            symbol: buyStock.symbol,
            amount,
            price: buyStock.Close,
            calculatedShares,
          }),
        });
        if (res.ok) {
          showNotification(
            `Purchase successful: You spent $${amount} to buy ~${calculatedShares} shares of ${buyStock.symbol}.`,
            'success'
          );
          refreshPortfolioData();
        } else {
          const errData = await res.json();
          showNotification(`Purchase denied: ${errData.error}`, 'error');
        }
      } catch (err) {
        console.error('Error during purchase:', err);
        showNotification('An error occurred during purchase.', 'error');
      }
      setShowBuyModal(false);
    } else {
      showNotification('Please enter a valid dollar amount.', 'error');
    }
  };

  const handleCancelBuy = () => {
    setShowBuyModal(false);
  };

  const handleSell = (stock) => {
    const price = stock.shares > 0 ? Number((stock.value / stock.shares).toFixed(2)) : 0;
    setSellStock({ ...stock, Close: price });
    setSellDollarAmount('');
    setShowSellModal(true);
  };

  const handleConfirmSell = async () => {
    const amount = parseFloat(sellDollarAmount);
    if (amount && !isNaN(amount) && amount > 0) {
      const calculatedShares = parseFloat((amount / sellStock.Close).toFixed(2));
      const portfolioId = localStorage.getItem('current_portfolio_id');
      if (!portfolioId) {
        showNotification('No portfolio selected. Please create or select a portfolio.', 'error');
        setShowSellModal(false);
        return;
      }

      try {
        const res = await fetch('/api/sell_button', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            symbol: sellStock.symbol,
            amount,
            price: sellStock.Close,
            calculatedShares,
          }),
        });
        if (res.ok) {
          showNotification(
            `Sale successful: You sold ~$${amount} worth of ${sellStock.symbol} (~${calculatedShares} shares).`,
            'success'
          );
          refreshPortfolioData();
        } else {
          const errData = await res.json();
          showNotification(`Sale denied: ${errData.error}`, 'error');
        }
      } catch (err) {
        console.error('Error during sale:', err);
        showNotification('An error occurred during sale.', 'error');
      }
      setShowSellModal(false);
    } else {
      showNotification('Please enter a valid dollar amount.', 'error');
    }
  };

  const handleCancelSell = () => {
    setShowSellModal(false);
  };

  const handleSellMax = () => {
    if (sellStock && sellStock.value) {
      setSellDollarAmount(sellStock.value.toString());
    }
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
          <Link href="/stocks" passHref>
            <div style={styles.sideNavItem}>Stocks</div>
          </Link>
          <Link href="/friends" passHref>
            <div style={styles.sideNavItem}>Friends</div>
          </Link>
          <Link href="/create_stock_list" passHref>
            <div style={styles.sideNavItem}>Create stocklist</div>
          </Link>
          <Link href="/stock_lists" passHref>
            <div style={styles.sideNavItem}>Stocklists</div>
          </Link>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </nav>

      <main style={{ flexGrow: 1, padding: '2rem' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
              Total Balance: {totalBalance !== null ? `$${totalBalance}` : '[insert total balance here]'}
            </h1>
            <p style={{ margin: 0, color: '#39d39f' }}>
              [Total Balance includes cash + stocks]
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/deposit" passHref>
              <button style={styles.whiteButton}>Deposit</button>
            </Link>
            <Link href="/transfer" passHref>
              <button style={styles.whiteButton}>Transfer</button>
            </Link>
            <Link href="/withdraw" passHref>
              <button style={styles.whiteButton}>Withdraw</button>
            </Link>
          </div>
        </header>

        <nav
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            alignItems: 'center',
          }}
        >
          <button style={styles.whiteButton}>Overview</button>
          <Link href="/transactions" passHref>
            <button style={styles.outlinedButton}>Transactions</button>
          </Link>
          <select
            onChange={handlePortfolioChange}
            value={selectedPortfolioId || ''}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {portfolios.map((portfolio) => (
              <option key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                {portfolio.portfolio_id}
              </option>
            ))}
          </select>
        </nav>

        <section style={styles.section}>
          <h2 style={{ marginTop: 0 }}>Portfolio Chart</h2>
          <div style={styles.chartPlaceholder}>
            <p>[insert chart here]</p>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={{ marginTop: 0 }}>Cash</h2>
          <p>{cashBalance !== null ? `$${cashBalance}` : '[insert cash balance here]'}</p>

          <h2>Stocks (Value: ${totalStockValue})</h2>
          {portfolioStocks.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={cellStyle}>Symbol</th>
                  <th style={cellStyle}>Shares</th>
                  <th style={cellStyle}>Value</th>
                  <th style={cellStyle}>Buy</th>
                  <th style={cellStyle}>Sell</th>
                </tr>
              </thead>
              <tbody>
                {portfolioStocks.map((stock, index) => (
                  <tr key={index}>
                    <td style={cellStyle}>{stock.symbol}</td>
                    <td style={cellStyle}>{stock.shares}</td>
                    <td style={cellStyle}>${stock.value}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <button
                        style={styles.buyButton}
                        onClick={() => handleBuy(stock)}
                      >
                        Buy
                      </button>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <button
                        style={styles.sellButton}
                        onClick={() => handleSell(stock)}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No stocks in this portfolio.</p>
          )}
        </section>

        {error && <p style={{ color: '#f00' }}>{error}</p>}
      </main>

      {/* Buy Modal */}
      {showBuyModal && buyStock && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '10px' }}>Buy shares of {buyStock.symbol}</h2>
            <p style={{ marginBottom: '20px' }}>How much would you like to invest?</p>
            <p style={{ marginBottom: '20px' }}>Close Price: ${buyStock.Close}</p>
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

      {/* Sell Modal */}
      {showSellModal && sellStock && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '10px' }}>Sell shares of {sellStock.symbol}</h2>
            <p style={{ marginBottom: '20px' }}>How much would you like to sell?</p>
            <p style={{ marginBottom: '20px' }}>Close Price: ${sellStock.Close}</p>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Dollar Amount:
              <input
                type="number"
                value={sellDollarAmount}
                onChange={(e) => setSellDollarAmount(e.target.value)}
                style={inputStyle}
              />
            </label>
            <div style={modalButtonsStyle}>
              <button onClick={handleSellMax} style={styles.maxButton}>
                Max
              </button>
              <button onClick={handleConfirmSell} style={styles.sellButton}>
                Confirm
              </button>
              <button onClick={handleCancelSell} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification && (
        <div style={notificationStyle(notification.type)}>
          {notification.message}
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
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: '#222',
  color: '#fff',
  borderRadius: '8px',
  padding: '30px',
  width: '400px',
  textAlign: 'center',
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

const notificationStyle = (type) => ({
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
  color: '#fff',
  padding: '15px 30px',
  borderRadius: '25px',
  boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
  zIndex: 1100,
  fontFamily: 'sans-serif',
  fontSize: '16px'
});

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
  whiteButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid #fff',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },
  section: {
    backgroundColor: '#1c1c1c',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '2rem',
  },
  chartPlaceholder: {
    height: '200px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: 'green',
    color: '#fff',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  sellButton: {
    backgroundColor: 'red',
    color: '#fff',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  maxButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
