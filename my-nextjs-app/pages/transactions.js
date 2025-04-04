import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

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
      {/* Side Navigation */}
      <nav
        style={{
          width: '250px',
          backgroundColor: '#111',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <Link href="/portfolio" passHref>
          <div style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #333' }}>
            Portfolio
          </div>
        </Link>
        <Link href="/transactions" passHref>
          <div style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #333' }}>
            Orders
          </div>
        </Link>
      </nav>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Transactions</h1>
            <p style={{ margin: 0, color: '#39d39f' }}>
              Transaction history for your portfolio
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/deposit" passHref>
              <button
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                }}
              >
                Deposit
              </button>
            </Link>
            <button
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              Transfer
            </button>
          </div>
        </header>

        {/* Transactions List */}
        <section
          style={{
            backgroundColor: '#1c1c1c',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Transaction History</h2>
          {error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Type</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Symbol</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Shares</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Price</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Amount</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {tx.transaction_type}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {tx.symbol || '-'}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {tx.shares && tx.shares > 0 ? tx.shares : '-'}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {tx.price && tx.price > 0 ? `$${tx.price}` : '-'}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      ${tx.amount}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {new Date(tx.transaction_date).toLocaleString()}
                    </td>
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
