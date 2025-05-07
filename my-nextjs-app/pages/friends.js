import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendData, setFriendData] = useState([]); 
  const [outgoingRequests, setOutgoingRequests] = useState([]); 
  const [incomingRequests, setIncomingRequests] = useState([]); 
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [newFriendId, setNewFriendId] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchFriends();
    fetchOutgoingRequests();
    fetchIncomingRequests();
  }, []);

  const fetchFriends = async () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) return;
    try {
      const res = await fetch(`/api/get_friends?user_id=${user_id}`);
      if (res.ok) {
        const data = await res.json();
        setFriendData(data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchOutgoingRequests = async () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) return;
    try {
      const res = await fetch(`/api/retrieve_request?sender_id=${user_id}`);
      if (res.ok) {
        const data = await res.json();
        setOutgoingRequests(data.filter((req) => req.status === 'pending'));
      }
    } catch (err) {
      console.error('Error fetching outgoing requests:', err);
    }
  };

  const fetchIncomingRequests = async () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) return;
    try {
      const res = await fetch(`/api/retrieve_request?receiver_id=${user_id}`);
      if (res.ok) {
        const data = await res.json();
        setIncomingRequests(data.filter((req) => req.status === 'pending'));
      }
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddFriend = async () => {
    if (!newFriendId) {
      setError('Please enter a user id.');
      return;
    }
    const sender_id = localStorage.getItem('user_id');
    if (!sender_id) {
      setError('User not logged in.');
      return;
    }
    try {
      const res = await fetch('/api/friend_request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id, receiver_id: newFriendId }),
      });
      if (res.ok) {
        showNotification(`Friend request sent to ${newFriendId}`, 'success');
        fetchOutgoingRequests();
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Error sending friend request', 'error');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
    setShowAddFriendModal(false);
    setNewFriendId('');
  };

  const handleDeleteFriend = async (friend_id) => {
    const user_id = localStorage.getItem('user_id');
    try {
      const res = await fetch('/api/delete_friend', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, friend_id }),
      });
      if (res.ok) {
        showNotification('Friend deleted', 'success');
        fetchFriends();
      }
    } catch (err) {
      console.error('Error deleting friend:', err);
    }
  };

  const handleDeleteOutgoing = async (request_id) => {
    const sender_id = localStorage.getItem('user_id');
    try {
      const res = await fetch('/api/delete_outgoing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, sender_id }),
      });
      if (res.ok) {
        showNotification('Outgoing request deleted', 'success');
        fetchOutgoingRequests();
      }
    } catch (err) {
      console.error('Error deleting outgoing request:', err);
    }
  };

  const handleDeleteIncoming = async (request_id) => {
    const receiver_id = localStorage.getItem('user_id');
    try {
      const res = await fetch('/api/delete_request_incoming', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, receiver_id }),
      });
      if (res.ok) {
        showNotification('Friend request rejected', 'success');
        fetchIncomingRequests();
      }
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  const handleAcceptRequest = async (request_id) => {
    const receiver_id = localStorage.getItem('user_id');
    try {
      const res = await fetch('/api/accept_request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, receiver_id }),
      });
      if (res.ok) {
        showNotification('Friend request accepted', 'success');
        fetchIncomingRequests();
        fetchOutgoingRequests();
        fetchFriends();
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
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
        <button style={styles.logoutButton} onClick={() => router.push('/login')}>Log Out</button>
      </nav>

      <main style={{ flexGrow: 1, padding: '2rem', backgroundColor: '#0b0b0b', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '10px' }}>
          {['friends', 'outgoing', 'incoming'].map(tab => (
            <button
              key={tab}
              style={activeTab === tab ? styles.activeTabButton : styles.tabButton}
              onClick={() => handleTabChange(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)} {tab !== 'friends' ? "Requests" : ""}
            </button>
          ))}
        </div>

        {activeTab === 'friends' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Your Friends</h2>
              <button style={styles.greenAddButton} onClick={() => setShowAddFriendModal(true)}>Add Friend</button>
            </div>
            {friendData.length ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.headerCell}>Name</th>
                    <th style={styles.headerCell}>User ID</th>
                    <th style={styles.headerCell}>Date</th>
                    <th style={styles.headerCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {friendData.map((f) => (
                    <tr key={f.friend_id}>
                      <td style={styles.cell}>{f.first_name} {f.last_name}</td>
                      <td style={styles.cell}>{f.friend_id}</td>
                      <td style={styles.cell}>{new Date(f.established_at).toLocaleString()}</td>
                      <td style={styles.cell}><button style={styles.deleteButton} onClick={() => handleDeleteFriend(f.friend_id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>You have no friends yet.</p>}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div>
            <h2></h2>
            {outgoingRequests.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.headerCell}>User ID</th>
                    <th style={styles.headerCell}>Status</th>
                    <th style={styles.headerCell}>Time</th>
                    <th style={styles.headerCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoingRequests.map(r => (
                    <tr key={r.request_id}>
                      <td style={styles.cell}>{r.receiver_id}</td>
                      <td style={styles.cell}>{r.status}</td>
                      <td style={styles.cell}>{new Date(r.request_time).toLocaleString()}</td>
                      <td style={styles.cell}><button style={styles.deleteButton} onClick={() => handleDeleteOutgoing(r.request_id)}>X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>You have no outgoing requests.</p>}
          </div>
        )}

        {activeTab === 'incoming' && (
          <div>
            <h2></h2>
            {incomingRequests.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.headerCell}>User ID</th>
                    <th style={styles.headerCell}>Status</th>
                    <th style={styles.headerCell}>Time</th>
                    <th style={styles.headerCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingRequests.map(r => (
                    <tr key={r.request_id}>
                      <td style={styles.cell}>{r.sender_id}</td>
                      <td style={styles.cell}>{r.status}</td>
                      <td style={styles.cell}>{new Date(r.request_time).toLocaleString()}</td>
                      <td style={styles.cell}>
                        <button style={styles.deleteButton} onClick={() => handleDeleteIncoming(r.request_id)}>X</button>
                        <button style={styles.acceptButton} onClick={() => handleAcceptRequest(r.request_id)}>&#10004;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>You have no incoming requests.</p>}
          </div>
        )}
      </main>

      {showAddFriendModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Add Friend</h2>
            <p>Enter the user ID of the person you'd like to add:</p>
            <input
              type="text"
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value)}
              style={styles.input}
              placeholder="User ID"
            />
            <div style={styles.modalButtons}>
              <button style={styles.greenAddButton} onClick={handleAddFriend}>Confirm</button>
              <button style={styles.cancelButton} onClick={() => setShowAddFriendModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div style={styles.notification(notification.type)}>{notification.message}</div>
      )}
    </div>
  );
}

const styles = {
  sideNav: {
    width: '250px',
    backgroundColor: '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#fff',
  },
  sideNavItem: {
    cursor: 'pointer',
    padding: '10px',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontFamily: '"Playfair Display", cursive',
  },
  logoutButton: {
    backgroundColor: 'red',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Times New Roman, serif',
  },
  headerCell: {
    border: '1px solid #555',
    padding: '8px',
    textAlign: 'center',
  },
  cell: {
    border: '1px solid #555',
    padding: '8px',
    textAlign: 'center',
    fontFamily: 'Times New Roman, serif',
  },
  deleteButton: {
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  acceptButton: {
    backgroundColor: '#39d39f',
    color: '#fff',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '5px',
  },
  greenAddButton: {
    backgroundColor: '#39d39f',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '12px',
  },
  cancelButton: {
    backgroundColor: '#555',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tabButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    flex: 1,
    fontFamily: '"Playfair Display", cursive',  // <--- Added cursive font here
  },
  activeTabButton: {
    backgroundColor: '#39d39f',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    flex: 1,
    fontWeight: 'bold',
    fontFamily: '"Playfair Display", cursive',  // <--- Added cursive font here
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#222',
    color: '#fff',
    padding: '30px',
    borderRadius: '8px',
    width: '400px',
    textAlign: 'center',
    fontFamily: 'Times New Roman, serif',
  },
  input: {
    marginTop: '10px',
    padding: '8px',
    width: '90%',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  modalButtons: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-around',
  },
  notification: (type) => ({
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '25px',
    zIndex: 1100,
    fontFamily: 'sans-serif',
  }),
};
