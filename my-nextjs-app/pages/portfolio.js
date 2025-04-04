import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

let debounceTimer = null;

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [cashBalance, setCashBalance] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

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
            setCashBalance(initialPortfolio.cash_balance);
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

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const res = await fetch(`/api/portfolio_balance?portfolio_id=${selectedPortfolioId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache', 
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setCashBalance(data.cash_balance);
        } else {
          const errData = await res.json();
          setError(errData.error);
          setCashBalance(null); 
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching portfolio balance:', err);
          setError('An unexpected error occurred.');
          setCashBalance(null);
        }
      }
    };

    fetchBalance();

    return () => {
      isMounted = false;
    };
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
        setCashBalance(null);
      }
    }, 100);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
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
              Total Balance: {cashBalance !== null ? `$${cashBalance}` : '[insert cash balance here]'}
            </h1>
            <p style={{ margin: 0, color: '#39d39f' }}>[insert balance change here]</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/deposit" passHref>
              <button style={styles.whiteButton}>Deposit</button>
            </Link>
            <button style={styles.whiteButton}>Transfer</button>
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

          <h2>Stocks</h2>
          <p>[insert list of stocks here]</p>
        </section>

        <section style={styles.section}>
          <h2 style={{ marginTop: 0 }}>Rewards & Allocations</h2>
          <p>[insert reward info here]</p>
          <p>[insert allocation details here]</p>
        </section>

        {error && <p style={{ color: '#f00' }}>{error}</p>}
      </main>
    </div>
  );
}

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
};
