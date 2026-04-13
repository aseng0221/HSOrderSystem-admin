import {useState} from 'react';
import {db} from '../firebase';
import {collection, doc, updateDoc, query, orderBy} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  X,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
    price: string;
    image?: string;
  };
  selectedOptions?: Record<string, string[]>;
}

interface Order {
  id: string;
  userId: string;
  orderMode: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  branchId?: string;
  addressId?: string | null;
  createdAt?: {toDate?: () => Date} | Date | number | string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', // Amber
  processing: '#3b82f6', // Blue
  completed: '#10b981', // Green
  cancelled: '#ef4444', // Red
};

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  const [snapshot, loading, error] = useCollection(q);
  const orders =
    snapshot?.docs.map(doc => ({id: doc.id, ...doc.data()} as Order)) || [];

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderDoc = doc(db, 'orders', orderId);
      await updateDoc(orderDoc, {status: newStatus});
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus});
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update order status');
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | number | string | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date =
      typeof timestamp === 'object' &&
      'toDate' in timestamp &&
      typeof timestamp.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp as Date | number | string);
    return date.toLocaleString();
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
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
          <span>{orders.length} Total Orders</span>
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
                <th>Date</th>
                <th>Mode</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{fontWeight: '600', color: 'var(--primary)'}}>
                      {order.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td style={{fontSize: '0.85rem'}}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        background: '#eef2ff',
                        color: 'var(--primary)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                      }}>
                      {order.orderMode}
                    </span>
                  </td>
                  <td style={{fontWeight: 'bold'}}>
                    RM {order.totalAmount.toFixed(2)}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        background: `${STATUS_COLORS[order.status] || '#ccc'}20`,
                        color: STATUS_COLORS[order.status] || '#666',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        fontWeight: 'bold',
                        border: `1px solid ${STATUS_COLORS[order.status] || '#ccc'}`,
                      }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-secondary"
                        onClick={() => handleViewDetails(order)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                        <MoreVertical size={14} />
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '700px'}}>
            <div className="page-header" style={{marginBottom: '1rem'}}>
              <div>
                <h3 style={{margin: 0}}>Order Details</h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}>
                  ID: {selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}>
              <div
                style={{
                  background: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}>
                <h4 style={{marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                  Customer Info
                </h4>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>User ID:</strong> {selectedOrder.userId}
                </p>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>Order Mode:</strong> {selectedOrder.orderMode}
                </p>
                {selectedOrder.branchId && (
                  <p style={{fontSize: '0.85rem'}}>
                    <strong>Branch ID:</strong> {selectedOrder.branchId}
                  </p>
                )}
                {selectedOrder.addressId && (
                  <p style={{fontSize: '0.85rem'}}>
                    <strong>Address ID:</strong> {selectedOrder.addressId}
                  </p>
                )}
              </div>

              <div
                style={{
                  background: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}>
                <h4 style={{marginBottom: '0.5rem', fontSize: '0.9rem'}}>
                  Payment Info
                </h4>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>Total:</strong> RM{' '}
                  {selectedOrder.totalAmount.toFixed(2)}
                </p>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>Method:</strong> {selectedOrder.paymentMethod}
                </p>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>Status:</strong> {selectedOrder.paymentStatus}
                </p>
                <p style={{fontSize: '0.85rem'}}>
                  <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
            </div>

            <h4 style={{marginBottom: '0.5rem', fontSize: '1rem'}}>
              Order Items
            </h4>
            <div
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}>
              <table className="data-table" style={{marginTop: 0}}>
                <thead style={{background: '#f8f9fa'}}>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}>
                          {item.product.image && (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                          <span style={{fontWeight: '500'}}>
                            {item.product.name}
                          </span>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>RM {item.unitPrice.toFixed(2)}</td>
                      <td style={{fontWeight: 'bold'}}>
                        RM {(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
              <h4 style={{marginBottom: '1rem', fontSize: '1rem'}}>
                Update Status
              </h4>
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <button
                  className="btn-secondary"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                  disabled={selectedOrder.status === 'pending'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    opacity: selectedOrder.status === 'pending' ? 0.5 : 1,
                  }}>
                  <Clock size={16} /> Pending
                </button>
                <button
                  className="btn-primary"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'processing')
                  }
                  disabled={selectedOrder.status === 'processing'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#3b82f6',
                    opacity: selectedOrder.status === 'processing' ? 0.5 : 1,
                  }}>
                  <Clock size={16} /> Processing
                </button>
                <button
                  className="btn-primary"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'completed')
                  }
                  disabled={selectedOrder.status === 'completed'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#10b981',
                    opacity: selectedOrder.status === 'completed' ? 0.5 : 1,
                  }}>
                  <CheckCircle size={16} /> Completed
                </button>
                <button
                  className="btn-primary"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder.id, 'cancelled')
                  }
                  disabled={selectedOrder.status === 'cancelled'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: '#ef4444',
                    opacity: selectedOrder.status === 'cancelled' ? 0.5 : 1,
                  }}>
                  <XCircle size={16} /> Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
