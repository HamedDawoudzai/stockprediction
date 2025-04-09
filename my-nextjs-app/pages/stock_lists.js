import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function StockListsPage() {
  // Tab and list states
  const [activeTab, setActiveTab] = useState('public');
  const [stockLists, setStockLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null); // For main modal details
  const [modalTab, setModalTab] = useState('stocks'); // stocks/statistics/share/delete/review
  const [listItems, setListItems] = useState([]); // Items for selected stock list
  const [shareUserId, setShareUserId] = useState('');
  const [notification, setNotification] = useState(null); // { message, type }
  const [currentUserId, setCurrentUserId] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusTargetList, setStatusTargetList] = useState(null);

  // State for the review tab
  const [reviewTab, setReviewTab] = useState('current'); // 'current' or 'add'
  const [currentReviews, setCurrentReviews] = useState([]);
  const [reviewSubject, setReviewSubject] = useState('');
  const [reviewText, setReviewText] = useState('');

  const router = useRouter();

  // Get current user id from localStorage on mount
  useEffect(() => {
    const user = localStorage.getItem('user_id');
    setCurrentUserId(user || '');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Helper: Notification function
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Fetch stock lists based on activeTab; for private/shared lists, include user_id.
  const fetchStockLists = async (listType) => {
    try {
      let apiUrl = `/api/stock_lists?filter=${listType}`;
      if (listType === 'private' || listType === 'shared') {
        if (currentUserId) {
          apiUrl += `&user_id=${currentUserId}`;
        }
      }
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch stock lists');
      }
      const data = await response.json();
      setStockLists(data.lists);
    } catch (error) {
      console.error('Error fetching stock lists:', error);
      setStockLists([]);
    }
  };

  useEffect(() => {
    fetchStockLists(activeTab);
  }, [activeTab, currentUserId]);

  // Open modal when a list card is clicked.
  const openModal = (list) => {
    setSelectedList(list);
    setModalTab('stocks'); // default modal tab
    setShareUserId('');
    // Reset review states
    setReviewTab('current');
    setCurrentReviews([]);
    setReviewSubject('');
    setReviewText('');
  };

  // Close modal
  const closeModal = () => {
    setSelectedList(null);
    setListItems([]);
    setShareUserId('');
  };

  // Fetch stock list items for the selected list when modalTab is "stocks"
  useEffect(() => {
    const fetchItemsForList = async () => {
      if (selectedList && modalTab === 'stocks') {
        try {
          const response = await fetch(`/api/stocklist_items?stock_list_id=${selectedList.stock_list_id}`);
          if (response.ok) {
            const data = await response.json();
            setListItems(data.items || []);
          } else {
            console.error('Failed to fetch stock items');
            setListItems([]);
          }
        } catch (error) {
          console.error('Error fetching stock items:', error);
          setListItems([]);
        }
      }
    };
    fetchItemsForList();
  }, [selectedList, modalTab]);

  // Fetch reviews when the Review modal tab is active and the 'current' review sub-tab is selected
  useEffect(() => {
    const fetchReviews = async () => {
      if (selectedList && modalTab === 'review' && reviewTab === 'current') {
        try {
          const response = await fetch(`/api/reviews?stock_list_id=${selectedList.stock_list_id}`);
          if (response.ok) {
            const data = await response.json();
            setCurrentReviews(data.reviews || []);
          } else {
            console.error('Failed to fetch reviews');
            setCurrentReviews([]);
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setCurrentReviews([]);
        }
      }
    };
    fetchReviews();
  }, [selectedList, modalTab, reviewTab]);

  // Handle sharing a stock list.
  const handleShare = async () => {
    if (!shareUserId) {
      showNotification('Please enter a user ID to share with.', 'error');
      return;
    }
    if (selectedList.creator_id !== currentUserId) {
      showNotification('You are not authorized to share this stock list.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/share_stocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_list_id: selectedList.stock_list_id,
          shared_with_user_id: shareUserId,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        showNotification('Stock list shared successfully!', 'success');
        if (selectedList.visibility === 'private') {
          await fetchStockLists(activeTab);
        } else {
          const updatedSharedWith = selectedList.shared_with && selectedList.shared_with.trim() !== ''
            ? `${selectedList.shared_with}, ${shareUserId}`
            : shareUserId;
          const updatedList = {
            ...selectedList,
            visibility: 'shared',
            shared_with: updatedSharedWith,
          };
          setSelectedList(updatedList);
          setStockLists(prevLists => prevLists.map(l =>
            l.stock_list_id === updatedList.stock_list_id ? updatedList : l
          ));
        }
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error sharing stock list:', error);
      showNotification('An error occurred while sharing.', 'error');
    }
  };

  // Open the change status modal.
  const openStatusModal = (list) => {
    if (list.creator_id !== currentUserId) {
      showNotification('You are not authorized to change this stock list status.', 'error');
      return;
    }
    setStatusTargetList(list);
    const defaultStatus = list.visibility === 'shared' ? 'public' : list.visibility;
    setNewStatus(defaultStatus);
    setShowStatusModal(true);
  };

  // Confirm status change.
  const handleConfirmChangeStatus = async () => {
    if (!newStatus) return;
    try {
      const response = await fetch('/api/change_status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_list_id: statusTargetList.stock_list_id,
          new_status: newStatus,
          user_id: currentUserId,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        showNotification('Status updated successfully!', 'success');
        fetchStockLists(activeTab);
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('An error occurred while updating status.', 'error');
    }
    setShowStatusModal(false);
    setStatusTargetList(null);
    setNewStatus('');
  };

  const handleCancelChangeStatus = () => {
    setShowStatusModal(false);
    setStatusTargetList(null);
    setNewStatus('');
  };

  // Handle deletion of a stock list.
  const handleDeleteStockList = async () => {
    try {
      const response = await fetch('/api/delete_stocklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_list_id: selectedList.stock_list_id,
          user_id: currentUserId,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        showNotification('Stock list deleted successfully!', 'success');
        setStockLists(prevLists => prevLists.filter(l => l.stock_list_id !== selectedList.stock_list_id));
        closeModal();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting stock list:', error);
      showNotification('An error occurred while deleting the stock list.', 'error');
    }
  };

  // Handle adding (or updating) a review.
  const handleAddReview = async () => {
    if (!reviewSubject.trim() || !reviewText.trim()) {
      showNotification('Please provide both a subject and review text.', 'error');
      return;
    }
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: currentUserId,
          stock_list_id: selectedList.stock_list_id,
          subject: reviewSubject.trim(),
          review_text: reviewText.trim(),
        }),
      });
      const result = await response.json();
      if (response.ok) {
        showNotification(result.message, 'success');
        setReviewTab('current');
        // Refresh reviews after adding/updating.
        const res = await fetch(`/api/reviews?stock_list_id=${selectedList.stock_list_id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentReviews(data.reviews || []);
        }
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      showNotification('An error occurred while adding the review.', 'error');
    }
  };

  // Handle deleting a review.
  // This function calls our /api/delete_review endpoint.
  const handleDeleteReview = async (reviewerIdToDelete) => {
    try {
      const response = await fetch('/api/delete_review', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_id: reviewerIdToDelete,
          stock_list_id: selectedList.stock_list_id,
          user_id: currentUserId,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        showNotification(result.message, 'success');
        // Refresh the reviews after deletion.
        const res = await fetch(`/api/reviews?stock_list_id=${selectedList.stock_list_id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentReviews(data.reviews || []);
        }
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showNotification('An error occurred while deleting the review.', 'error');
    }
  };

  // Render change status modal.
  const renderChangeStatusModal = () => {
    if (!showStatusModal) return null;
    return (
      <div style={styles.modalOverlay} onClick={handleCancelChangeStatus}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h3 style={styles.modalSectionTitle}>
            Change status for "{statusTargetList?.stock_list_id}"
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>New Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={styles.inputField}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button onClick={handleConfirmChangeStatus} style={styles.shareButton}>
              Confirm
            </button>
            <button onClick={handleCancelChangeStatus} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render modal content based on modalTab.
  const renderModalContent = () => {
    if (!selectedList) return null;
    switch (modalTab) {
      case 'stocks':
        return (
          <div>
            <h3 style={styles.modalSectionTitle}>
              Stocks in "{selectedList.stock_list_id}"
            </h3>
            {listItems.length === 0 ? (
              <p>No stocks found for this list.</p>
            ) : (
              <div style={styles.stockListContainer}>
                <table style={styles.stockTable}>
                  <thead>
                    <tr>
                      <th style={styles.stockTableHeader}>Symbol</th>
                      <th style={styles.stockTableHeader}>Shares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listItems.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.stockTableCell}>{item.symbol}</td>
                        <td style={styles.stockTableCell}>{item.shares}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'statistics':
        return (
          <p>
            Here we can display statistics for "{selectedList.stock_list_id}" (to be implemented).
          </p>
        );
      case 'share':
        return (
          <div>
            <h3 style={styles.modalSectionTitle}>
              Share "{selectedList.stock_list_id}"
            </h3>
            <input
              type="text"
              placeholder="Enter user ID to share with"
              value={shareUserId}
              onChange={(e) => setShareUserId(e.target.value)}
              style={styles.inputField}
            />
            <button onClick={handleShare} style={styles.shareButton}>
              Share
            </button>
          </div>
        );
      case 'delete':
        return (
          <div style={{ textAlign: 'center' }}>
            <h3 style={styles.modalSectionTitle}>
              Would you like to delete "{selectedList.stock_list_id}"?
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button onClick={handleDeleteStockList} style={styles.deleteConfirmButton}>
                Yes
              </button>
              <button onClick={() => setModalTab('stocks')} style={styles.deleteCancelButton}>
                No
              </button>
            </div>
          </div>
        );
      case 'review':
        return (
          <div>
            {/* Review sub-tabs */}
            <div style={styles.reviewTabContainer}>
              <button
                style={reviewTab === 'current' ? styles.subTabActive : styles.subTab}
                onClick={() => setReviewTab('current')}
              >
                Current Reviews
              </button>
              <button
                style={reviewTab === 'add' ? styles.subTabActive : styles.subTab}
                onClick={() => setReviewTab('add')}
              >
                Add Review
              </button>
            </div>
            {reviewTab === 'current' ? (
              <div>
                <h4 style={styles.modalSectionTitle}>
                  Reviews for "{selectedList.stock_list_id}"
                </h4>
                {currentReviews.length === 0 ? (
                  <p>No reviews yet.</p>
                ) : (
                  currentReviews.map((rev) => (
                    <div key={`${rev.reviewer_id}-${rev.stock_list_id}`} style={styles.reviewCard}>
                      <p><strong>Subject:</strong> {rev.subject}</p>
                      <p>{rev.review_text}</p>
                      <p style={styles.reviewSubText}>
                        <em>Reviewed by {rev.reviewer_id} on {new Date(rev.created_at).toLocaleString()}</em>
                      </p>
                      {(currentUserId === rev.reviewer_id || currentUserId === selectedList.creator_id) && (
                        <button
                          onClick={() => handleDeleteReview(rev.reviewer_id)}
                          style={{ ...styles.cancelButton, marginTop: '0.5rem' }}
                        >
                          Delete Review
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div>
                <h4 style={styles.modalSectionTitle}>Add a Review</h4>
                <input
                  type="text"
                  placeholder="Enter review subject"
                  value={reviewSubject}
                  onChange={(e) => setReviewSubject(e.target.value)}
                  style={styles.inputField}
                />
                <textarea
                  placeholder="Write your review (max 4000 characters)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{ ...styles.inputField, height: '150px', resize: 'vertical' }}
                  maxLength={4000}
                />
                <button onClick={handleAddReview} style={styles.shareButton}>
                  Submit Review
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Render main stock list cards.
  const renderContent = () => (
    <div>
      <h2 style={styles.pageHeader}>
        {activeTab === 'public' && 'Public Stock Lists'}
        {activeTab === 'private' && 'Private Stock Lists'}
        {activeTab === 'shared' && 'Shared Stock Lists'}
      </h2>
      {stockLists.length === 0 ? (
        <p style={styles.noLists}>No lists found.</p>
      ) : (
        stockLists.map((list) => (
          <div
            key={list.stock_list_id}
            style={styles.card}
            onClick={() => openModal(list)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={styles.cardTitle}>{list.stock_list_id}</h3>
              {list.creator_id === currentUserId && (
                <button
                  style={styles.changeStatusButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    openStatusModal(list);
                  }}
                >
                  Change Status
                </button>
              )}
            </div>
            <p style={styles.cardText}>{list.description}</p>
            <p style={styles.cardSubText}>
              <strong>Created by:</strong> {list.creator_id}
            </p>
            {list.shared_with && list.shared_with.trim() !== '' && (
              <p style={styles.cardSubText}>
                <strong>Shared with:</strong> {list.shared_with}
              </p>
            )}
            {/* Review button removed from the card view */}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={styles.pageContainer}>
      {/* Sidebar Navigation */}
      <nav style={styles.sidebar}>
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
            <div style={styles.sideNavItem}>Create Stocklist</div>
          </Link>
          <Link href="/stock_lists" passHref>
            <div style={styles.sideNavItem}>Stocklists</div>
          </Link>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </nav>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h1 style={styles.mainHeader}>Stock Lists</h1>
        <div style={styles.tabContainer}>
          <button
            style={activeTab === 'public' ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setActiveTab('public')}
          >
            Public
          </button>
          <button
            style={activeTab === 'private' ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setActiveTab('private')}
          >
            Private
          </button>
          <button
            style={activeTab === 'shared' ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setActiveTab('shared')}
          >
            Shared
          </button>
        </div>
        <div style={styles.contentStyle}>{renderContent()}</div>
      </div>

      {/* Modal Overlay */}
      {selectedList && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <button
                style={modalTab === 'stocks' ? styles.modalTabActive : styles.modalTab}
                onClick={() => setModalTab('stocks')}
              >
                Stocks
              </button>
              <button
                style={modalTab === 'statistics' ? styles.modalTabActive : styles.modalTab}
                onClick={() => setModalTab('statistics')}
              >
                Statistics
              </button>
              <button
                style={modalTab === 'share' ? styles.modalTabActive : styles.modalTab}
                onClick={() => setModalTab('share')}
              >
                Share
              </button>
              <button
                style={modalTab === 'delete' ? styles.modalTabActive : styles.modalTab}
                onClick={() => setModalTab('delete')}
              >
                Delete
              </button>
              <button
                style={modalTab === 'review' ? styles.modalTabActive : styles.modalTab}
                onClick={() => setModalTab('review')}
              >
                Review
              </button>
              <button style={styles.closeModalButton} onClick={closeModal}>
                X
              </button>
            </div>
            <div style={styles.modalBody}>{renderModalContent()}</div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {renderChangeStatusModal()}

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            ...styles.notification,
            backgroundColor: notification.type === 'error' ? '#d9534f' : '#5cb85c',
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0b0b0b',
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: '#fff',
    position: 'relative',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#111',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sideNavItem: {
    cursor: 'pointer',
    padding: '10px',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontSize: '1rem',
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
  mainContent: {
    flexGrow: 1,
    padding: '2rem',
    backgroundColor: '#0b0b0b',
  },
  mainHeader: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  tabButton: {
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: '500',
  },
  tabButtonActive: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: '600',
  },
  contentStyle: {
    backgroundColor: '#1c1c1c',
    borderRadius: '8px',
    padding: '1rem',
  },
  pageHeader: {
    marginBottom: '1rem',
    fontSize: '1.75rem',
    textAlign: 'center',
  },
  noLists: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#ccc',
  },
  card: {
    backgroundColor: '#2a2a2a',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  cardTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  cardText: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    color: '#ddd',
  },
  cardSubText: {
    fontSize: '0.9rem',
    color: '#aaa',
  },
  changeStatusButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginRight: '0.5rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1c1c1c',
    borderRadius: '8px',
    padding: '1.5rem',
    width: '90%',
    maxWidth: '800px',
    minHeight: '400px',
    position: 'relative',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-around',
    borderBottom: '1px solid #444',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  modalTab: {
    backgroundColor: '#444',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalTabActive: {
    backgroundColor: '#007BFF',
    color: '#fff',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  closeModalButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  modalBody: {
    color: '#ddd',
    fontSize: '1rem',
  },
  modalSectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem',
  },
  stockListContainer: {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    padding: '1rem',
  },
  stockTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  stockTableHeader: {
    textAlign: 'left',
    padding: '0.5rem',
    backgroundColor: '#444',
    color: '#fff',
  },
  stockTableCell: {
    padding: '0.5rem',
    borderBottom: '1px solid #555',
    color: '#fff',
  },
  inputField: {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: '#fff',
  },
  shareButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteConfirmButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'green',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteCancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'red',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  notification: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 1.5rem',
    color: '#fff',
    fontSize: '1rem',
    borderRadius: '6px',
    zIndex: 1100,
  },
  reviewTabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  subTab: {
    backgroundColor: '#444',
    color: '#fff',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  subTabActive: {
    backgroundColor: '#007BFF',
    color: '#fff',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    padding: '0.75rem',
    marginBottom: '0.75rem',
  },
  reviewSubText: {
    fontSize: '0.8rem',
    color: '#aaa',
  },
};

