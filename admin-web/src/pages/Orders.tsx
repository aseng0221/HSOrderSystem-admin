import { ShoppingCart } from 'lucide-react';
import {db} from '../firebase';
import {collection, query, orderBy, deleteDoc, doc, updateDoc} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Trash2} from 'lucide-react';

const Orders = () => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  const [snapshot, loading, error] = useCollection(q);
  const orders = snapshot?.docs.map(doc => ({id: doc.id, ...(doc.data() as any)})) || [];

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', id));
      } catch (err) {
        console.error('Error deleting order:', err);
        alert('Failed to delete order.');
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders Management</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
          }}>
          <ShoppingCart size={20} />
          <span>Orders</span>
        </div>
      </div>
      <div className="card">
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}
        {!loading && !error && orders.length === 0 && <p>No orders found.</p>}
        {!loading && !error && orders.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {order.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    ${order.totalAmount || '0.00'}
                  </td>
                  <td>
                    <select
                      value={order.status || 'pending'}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteOrder(order.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                        }}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Orders;
