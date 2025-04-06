import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendData, setFriendData] = useState([]); // list of current friends (from friendships join users)
  const [outgoingRequests, setOutgoingRequests] = useState([]); // outgoing friend requests (pending)
  const [incomingRequests, setIncomingRequests] = useState([]); // incoming friend requests (pending)
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

  // Fetch friend list from get_friends endpoint.
  const fetchFriends = async () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) return;
    try {
      const res = await fetch(`/api/get_friends?user_id=${user_id}`);
      if (res.ok) {
        const data = await res.json();
        setFriendData(data);
      } else {
        console.error('Error fetching friends');
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
      } else {
        console.error('Error fetching outgoing requests');
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
      } else {
        console.error('Error fetching incoming requests');
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
        // Check for custom popup error.
        if (errData.popupType === 'custom') {
          showNotification(errData.error, 'custom');
        } else if (errData.error === 'Duplicate request exists') {
          showNotification('request already sent', 'error');
        } else {
          setError(errData.error || 'Error sending friend request');
        }
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError('An unexpected error occurred.');
    }
    setShowAddFriendModal(false);
    setNewFriendId('');
  };

  // Delete friend from friendships table.
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
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error deleting friend');
      }
    } catch (err) {
      console.error('Error deleting friend:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Delete outgoing friend request (sender cancels their own request)
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
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error deleting request');
      }
    } catch (err) {
      console.error('Error deleting outgoing request:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Reject incoming friend request (update status to rejected and set response_time)
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
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error rejecting request');
      }
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      setError('An unexpected error occurred.');
    }
  };

  // Accept incoming friend request (update status to accepted and create friendship)
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
      } else {
        const errData = await res.json();
        setError(errData.error || 'Error accepting request');
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Left Navigation */}
      <nav
        style={{
          width: '250px',
          flexShrink: 0,
          backgroundColor: '#111',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <div>
          <Link href="/portfolio" passHref>
            <div style={styles.sideNavItem}>Portfolio</div>
          </Link>
          <Link href="/friends" passHref>
            <div style={styles.sideNavItem}>Friends</div>
          </Link>
          <Link href="/transactions" passHref>
            <div style={styles.sideNavItem}>Orders</div>
          </Link>
          <Link href="/stocks" passHref>
            <div style={styles.sideNavItem}>Stocks</div>
          </Link>
        </div>
        <button style={styles.logoutButton} onClick={() => router.push('/login')}>
          Log Out
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '2rem', backgroundColor: '#0b0b0b', color: '#fff' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
          <button
            style={activeTab === 'friends' ? styles.activeTabButton : styles.tabButton}
            onClick={() => handleTabChange('friends')}
          >
            Friends
          </button>
          <button
            style={activeTab === 'outgoing' ? styles.activeTabButton : styles.tabButton}
            onClick={() => handleTabChange('outgoing')}
          >
            Outgoing Requests
          </button>
          <button
            style={activeTab === 'incoming' ? styles.activeTabButton : styles.tabButton}
            onClick={() => handleTabChange('incoming')}
          >
            Incoming Requests
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Your Friends</h2>
              <button style={styles.greenAddButton} onClick={() => setShowAddFriendModal(true)}>
                Add Friend
              </button>
            </div>
            {friendData.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={cellStyle}>Name</th>
                    <th style={cellStyle}>User ID</th>
                    <th style={cellStyle}>Friendship Date</th>
                    <th style={cellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {friendData.map((friend, index) => (
                    <tr key={index} style={{ fontSize: '0.9rem' }}>
                      <td style={cellStyle}>
                        {friend.first_name} {friend.last_name}
                      </td>
                      <td style={cellStyle}>{friend.friend_id}</td>
                      <td style={cellStyle}>{new Date(friend.established_at).toLocaleString()}</td>
                      <td style={cellStyle}>
                        <button style={styles.deleteButton} onClick={() => handleDeleteFriend(friend.friend_id)}>
                          Delete Friend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>You have no friends yet.</p>
            )}
          </div>
        )}

        {/* Outgoing Requests Tab */}
        {activeTab === 'outgoing' && (
          <div>
            <h2>Outgoing Friend Requests</h2>
            {outgoingRequests.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={cellStyle}>User ID</th>
                    <th style={cellStyle}>Status</th>
                    <th style={cellStyle}>Time</th>
                    <th style={cellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoingRequests.map((req) => (
                    <tr key={req.request_id} style={{ fontSize: '0.9rem' }}>
                      <td style={cellStyle}>{req.receiver_id}</td>
                      <td style={cellStyle}>{req.status}</td>
                      <td style={cellStyle}>{new Date(req.request_time).toLocaleString()}</td>
                      <td style={cellStyle}>
                        <button style={styles.deleteButton} onClick={() => handleDeleteOutgoing(req.request_id)}>
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No outgoing friend requests.</p>
            )}
          </div>
        )}

        {/* Incoming Requests Tab */}
        {activeTab === 'incoming' && (
          <div>
            <h2>Incoming Friend Requests</h2>
            {incomingRequests.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={cellStyle}>User ID</th>
                    <th style={cellStyle}>Status</th>
                    <th style={cellStyle}>Time</th>
                    <th style={cellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingRequests.map((req) => (
                    <tr key={req.request_id} style={{ fontSize: '0.9rem' }}>
                      <td style={cellStyle}>{req.sender_id}</td>
                      <td style={cellStyle}>{req.status}</td>
                      <td style={cellStyle}>{new Date(req.request_time).toLocaleString()}</td>
                      <td style={cellStyle}>
                        <button style={styles.deleteButton} onClick={() => handleDeleteIncoming(req.request_id)}>
                          X
                        </button>
                        <button style={styles.acceptButton} onClick={() => handleAcceptRequest(req.request_id)}>
                          &#10004;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No incoming friend requests.</p>
            )}
          </div>
        )}

        {error && <p style={{ color: '#f00' }}>{error}</p>}
      </main>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '10px' }}>Add Friend</h2>
            <p style={{ marginBottom: '20px' }}>Enter the user ID of the person you'd like to add:</p>
            <input
              type="text"
              value={newFriendId}
              onChange={(e) => setNewFriendId(e.target.value)}
              style={inputStyle}
              placeholder="User ID"
            />
            <div style={modalButtonsStyle}>
              <button style={styles.greenAddButton} onClick={handleAddFriend}>
                Confirm
              </button>
              <button style={styles.cancelButton} onClick={() => setShowAddFriendModal(false)}>
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
  border: '1px solid #555',
  padding: '4px 6px',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
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

const notificationStyle = (type) => {
  if (type === 'custom') {
    return {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'black',
      color: 'red',
      padding: '15px 30px',
      borderRadius: '25px',
      boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
      zIndex: 1100,
      fontFamily: 'sans-serif',
      fontSize: '16px'
    };
  }
  return {
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
  };
};

const styles = {
  sideNavItem: {
    cursor: 'pointer',
    padding: '10px',
    borderBottom: '1px solid #333',
    color: '#fff',
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
  greenAddButton: {
    backgroundColor: 'green',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#ddd',
    color: 'black',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    borderRadius: '4px',
    padding: '0.2rem 0.4rem',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
    marginRight: '0.5rem',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    borderRadius: '4px',
    padding: '0.2rem 0.4rem',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
  },
  tabButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    flex: 1,
    cursor: 'pointer',
  },
  activeTabButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    flex: 1,
    cursor: 'pointer',
  },
};
