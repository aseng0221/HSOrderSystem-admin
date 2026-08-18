import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { ClipboardList, X } from 'lucide-react';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

interface ProductInfo {
  id?: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface OrderItem {
  id: string;
  product: ProductInfo;
  quantity: number;
  unitPrice: number;
  selectedOptions?: Record<string, unknown> | null;
}

interface OrderData {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  orderMode: string;
  createdAt: FirestoreTimestamp | null;
  items: OrderItem[];
  receiptUrl?: string; // Optional field if user uploads receipt for order
}

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const ordersRef = collection(db, 'orders');
  const [snapshot, loading, error] = useCollection(ordersRef);

  const orders = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData))
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    }) || [];

  const handleViewDetails = (order: OrderData) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (field: 'status' | 'paymentStatus', value: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, { [field]: value });
      setSelectedOrder(prev => prev ? { ...prev, [field]: value } : null);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}.`);
    } finally {
      setUpdating(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'ready_to_pickup':
      case 'paid':
      case 'payment_received':
        return 'green';
      case 'cancelled':
      case 'failed':
        return 'red';
      case 'preparing':
      case 'in_progress':
        return 'blue';
      case 'unpaid':
      case 'pending':
      case 'pending_verification':
        return 'orange';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ClipboardList size={20} />
          <span>{orders.length} Orders</span>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading orders...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        {!loading && !error && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontSize: '0.85rem' }}>{order.id.slice(0, 8)}...</td>
                  <td style={{ fontSize: '0.85rem' }}>{order.userId.slice(0, 8)}...</td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(order.createdAt)}</td>
                  <td style={{ fontWeight: 'bold' }}>${order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>{order.orderMode}</td>
                  <td style={{ color: getStatusColor(order.status), fontWeight: 'bold' }}>
                    {order.status?.replace('_', ' ').toUpperCase()}
                  </td>
                  <td style={{ color: getStatusColor(order.paymentStatus), fontWeight: 'bold' }}>
                    {order.paymentStatus?.replace('_', ' ').toUpperCase()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleViewDetails(order)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="page-header">
              <h3 style={{ margin: 0 }}>Order Details: {selectedOrder.id}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ marginBottom: '1.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>General Info</h4>
                  <p><strong>User ID:</strong> {selectedOrder.userId}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.totalAmount?.toFixed(2)}</p>
                  <p><strong>Order Mode:</strong> {selectedOrder.orderMode}</p>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                </div>

                <div style={{ marginBottom: '1.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Status Updates</h4>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>Order Status:</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus('status', e.target.value)}
                      disabled={updating}>
                      <option value="pending">Pending</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="received">Received</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready_to_pickup">Ready to Pickup</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Status:</label>
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => handleUpdateStatus('paymentStatus', e.target.value)}
                      disabled={updating}>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="payment_received">Payment Received</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ flex: '2 1 400px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Order Items</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{item.product?.name || 'Unknown Product'}</div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>${item.unitPrice?.toFixed(2)}</td>
                          <td>${(item.quantity * item.unitPrice)?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedOrder.receiptUrl && (
                  <div style={{ marginTop: '1.5rem', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Payment Receipt</h4>
                    <img
                      src={selectedOrder.receiptUrl}
                      alt="Payment Receipt"
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
