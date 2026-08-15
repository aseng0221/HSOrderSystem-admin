import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Wallet, X } from 'lucide-react';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

interface TopupData {
  id: string;
  userId: string;
  amount: number;
  bonus: number;
  totalCredit: number;
  paymentMethod: string;
  receiptUrl?: string;
  status: string;
  createdAt: FirestoreTimestamp | null;
}

const Topups = () => {
  const [selectedTopup, setSelectedTopup] = useState<TopupData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const topupsRef = collection(db, 'topups');
  // In a real app we'd orderBy createdAt, but useCollection requires an index if we do that.
  // We will fetch and sort in memory to avoid missing index errors as per guidelines.
  const [snapshot, loading, error] = useCollection(topupsRef);

  const topups = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupData))
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    }) || [];

  const handleViewDetails = (topup: TopupData) => {
    setSelectedTopup(topup);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTopup) return;
    const oldStatus = selectedTopup.status;
    if (oldStatus === newStatus) return;

    setProcessing(true);
    try {
      const topupRef = doc(db, 'topups', selectedTopup.id);
      const userRef = doc(db, 'users', selectedTopup.userId);

      const { writeBatch, getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.exists() ? (userSnap.data().walletBalance || 0) : 0;

      const batch = writeBatch(db);

      // Determine balance change and transaction description
      let balanceChange = 0;
      let txDescription = '';

      const isOldApproved = oldStatus === 'approved';
      const isNewApproved = newStatus === 'approved';

      if (!isOldApproved && isNewApproved) {
        // Gaining approval: add funds
        balanceChange = selectedTopup.totalCredit;
        txDescription = `Wallet Top-Up - Approved (${selectedTopup.paymentMethod})`;
      } else if (isOldApproved && !isNewApproved) {
        // Losing approval: reverse funds
        balanceChange = -selectedTopup.totalCredit;
        txDescription = `Wallet Top-Up - Reversed (${newStatus === 'rejected' ? 'Rejected' : 'Pending Verification'})`;
      }

      // Update Topup Status
      batch.update(topupRef, { status: newStatus });

      if (balanceChange !== 0) {
        // Update User Balance
        batch.update(userRef, { walletBalance: currentBalance + balanceChange });

        // Log transaction record in user subcollection
        const walletTxRef = doc(collection(db, 'users', selectedTopup.userId, 'wallet_transactions'));
        batch.set(walletTxRef, {
          amount: balanceChange,
          previousBalance: currentBalance,
          newBalance: currentBalance + balanceChange,
          description: txDescription,
          createdAt: new Date(),
          topupId: selectedTopup.id,
        });
      }

      await batch.commit();
      setSelectedTopup(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Error updating topup status:', err);
      alert('Failed to update status.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp: FirestoreTimestamp | Date | string | number | null | undefined) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      const ts = timestamp as FirestoreTimestamp;
      return ts.toDate().toLocaleString();
    }
    return new Date(timestamp as string | number | Date).toLocaleString();
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'approved': return { color: 'green', fontWeight: 'bold' };
      case 'rejected': return { color: 'red', fontWeight: 'bold' };
      case 'pending_verification': return { color: 'orange', fontWeight: 'bold' };
      default: return { color: 'var(--text-secondary)' };
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Topup Requests</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Wallet size={20} />
          <span>{topups.length} Requests</span>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading topups...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        {!loading && !error && (
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Bonus</th>
                <th>Total Credit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topups.map(topup => (
                <tr key={topup.id}>
                  <td style={{ fontSize: '0.85rem' }}>{topup.userId.slice(0, 10)}...</td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(topup.createdAt)}</td>
                  <td>RM {topup.amount?.toFixed(2) || '0.00'}</td>
                  <td>RM {topup.bonus?.toFixed(2) || '0.00'}</td>
                  <td style={{ fontWeight: 'bold' }}>RM {topup.totalCredit?.toFixed(2) || '0.00'}</td>
                  <td style={getStatusStyle(topup.status)}>
                    {topup.status.replace('_', ' ').toUpperCase()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleViewDetails(topup)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      View & Verify
                    </button>
                  </td>
                </tr>
              ))}
              {topups.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    No topup requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && selectedTopup && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="page-header">
              <h3 style={{ margin: 0 }}>Topup Verification</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>User ID:</strong> {selectedTopup.userId}</div>
                <div><strong>Date:</strong> {formatDate(selectedTopup.createdAt)}</div>
                <div><strong>Payment Method:</strong> {selectedTopup.paymentMethod}</div>
                <div><strong>Amount:</strong> RM {selectedTopup.amount}</div>
                <div><strong>Bonus:</strong> RM {selectedTopup.bonus}</div>
                <div><strong>Total Credit to Add:</strong> RM {selectedTopup.totalCredit}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <strong>Status:</strong>{' '}
                  <span style={getStatusStyle(selectedTopup.status)}>
                    {selectedTopup.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Update Verification Status</label>
                <select
                  className="form-control"
                  value={selectedTopup.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={processing}>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="approved">Approved & Add Funds</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {selectedTopup.receiptUrl ? (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Receipt Image:</p>
                  <img
                    src={selectedTopup.receiptUrl}
                    alt="Receipt"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  />
                </div>
              ) : (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                  No receipt image provided.
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                disabled={processing}
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.6rem 2rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topups;
