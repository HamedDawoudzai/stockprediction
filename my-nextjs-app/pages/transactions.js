import React from 'react';
import Link from 'next/link';

export default function Transactions() {
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
            <p style={{ margin: 0, color: '#39d39f' }}>[insert transaction summary here]</p>
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

        {/* Filter / Transaction Types */}
        <section
          style={{
            backgroundColor: '#1c1c1c',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>All transaction types</h2>
          <p>[insert filter dropdowns or search here]</p>
        </section>

        {/* Transactions List */}
        <section
          style={{
            backgroundColor: '#1c1c1c',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Transaction History</h2>
          <p>[insert list of transactions for this user]</p>
        </section>
      </main>
    </div>
  );
}
