import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, updateDoc, increment } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Wallet, X, Check, XCircle } from 'lucide-react';

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

  const handleApprove = async () => {
    if (!selectedTopup) return;
    setProcessing(true);
    try {
      const topupRef = doc(db, 'topups', selectedTopup.id);
      const userRef = doc(db, 'users', selectedTopup.userId);

      const { writeBatch, getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.exists() ? (userSnap.data().walletBalance || 0) : 0;

      const batch = writeBatch(db);

      batch.update(topupRef, { status: 'approved' });
      batch.update(userRef, { walletBalance: increment(selectedTopup.totalCredit) });

      const walletTxRef = doc(collection(db, 'users', selectedTopup.userId, 'wallet_transactions'));
      batch.set(walletTxRef, {
        amount: selectedTopup.totalCredit,
        previousBalance: currentBalance,
        newBalance: currentBalance + selectedTopup.totalCredit,
        description: `Wallet Top-Up - Approved (${selectedTopup.paymentMethod})`,
        createdAt: new Date(),
        topupId: selectedTopup.id,
      });

      await batch.commit();

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error approving topup:', err);
      alert('Failed to approve topup.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTopup) return;
    setProcessing(true);
    try {
      const topupRef = doc(db, 'topups', selectedTopup.id);
      await updateDoc(topupRef, { status: 'rejected' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error rejecting topup:', err);
      alert('Failed to reject topup.');
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
                  <td>${topup.amount?.toFixed(2) || '0.00'}</td>
                  <td>${topup.bonus?.toFixed(2) || '0.00'}</td>
                  <td style={{ fontWeight: 'bold' }}>${topup.totalCredit?.toFixed(2) || '0.00'}</td>
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
                <div><strong>Amount:</strong> ${selectedTopup.amount}</div>
                <div><strong>Bonus:</strong> ${selectedTopup.bonus}</div>
                <div><strong>Total Credit to Add:</strong> ${selectedTopup.totalCredit}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={getStatusStyle(selectedTopup.status)}>
                    {selectedTopup.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
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

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {selectedTopup.status === 'pending_verification' && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={handleReject}
                    disabled={processing}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'red', color: 'red' }}>
                    <XCircle size={18} /> Reject
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleApprove}
                    disabled={processing}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'green', borderColor: 'green' }}>
                    <Check size={18} /> Approve & Add Funds
                  </button>
                </>
              )}
              {selectedTopup.status !== 'pending_verification' && (
                <button
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topups;
