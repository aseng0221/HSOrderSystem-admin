import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  Users as UsersIcon,
  MapPin,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Award,
  Wallet,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPinOff,
  ClipboardList,
  Edit,
  Save,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

interface UserAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface UserData {
  id: string;
  displayName?: string;
  phoneNumber?: string;
  email?: string;
  createdAt?: FirestoreTimestamp | null;
  lastLogin?: FirestoreTimestamp | null;
  points?: number;
  walletBalance?: number;
  birthdate?: string;
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
}

interface TopupData {
  id: string;
  userId: string;
  amount: number;
  bonus: number;
  totalCredit: number;
  paymentMethod: string;
  status: string;
  createdAt: FirestoreTimestamp | null;
  receiptUrl?: string;
}

interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
  createdAt: FirestoreTimestamp | null;
  topupId?: string;
  orderId?: string;
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  previousPoints: number;
  newPoints: number;
  description: string;
  createdAt: FirestoreTimestamp | null;
  orderId?: string;
}

const Users = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'points' | 'orders' | 'topups'>('profile');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    phoneNumber: '',
    email: '',
    birthdate: '',
    points: 0,
    walletBalance: 0,
  });

  // Fetch Users
  const usersRef = collection(db, 'users');
  const [snapshot, loading, error] = useCollection(usersRef);
  const users =
    snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)) || [];

  // Reactive Selected User
  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  // Fetch Orders
  const ordersRef = collection(db, 'orders');
  const [ordersSnapshot] = useCollection(ordersRef);
  const orders = ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData)) || [];

  // Fetch Topups
  const topupsRef = collection(db, 'topups');
  const [topupsSnapshot] = useCollection(topupsRef);
  const topups = topupsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopupData)) || [];

  // Fetch Wallet Transactions
  const walletTxsRef = selectedUserId
    ? collection(db, 'users', selectedUserId, 'wallet_transactions')
    : null;
  const [walletTxsSnapshot] = useCollection(walletTxsRef);
  const userWalletTxs = walletTxsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction))
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    }) || [];

  // Fetch Points Transactions
  const pointsTxsRef = selectedUserId
    ? collection(db, 'users', selectedUserId, 'point_history')
    : null;
  const [pointsTxsSnapshot] = useCollection(pointsTxsRef);
  const userPointsTxs = pointsTxsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointsTransaction))
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    }) || [];

  // Fetch addresses for selected user
  const addressesRef = selectedUserId
    ? collection(db, 'users', selectedUserId, 'addresses')
    : null;
  const [addressSnapshot, addressLoading] = useCollection(addressesRef);
  const addresses =
    addressSnapshot?.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as UserAddress),
    ) || [];

  const handleOpenDetails = (user: UserData) => {
    setSelectedUserId(user.id);
    setActiveTab('profile');
    setExpandedOrderId(null);
    setIsEditingProfile(false);
    setEditFormData({
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      birthdate: user.birthdate || '',
      points: user.points || 0,
      walletBalance: user.walletBalance || 0,
    });
    setIsDetailModalOpen(true);
  };

  const startEditing = () => {
    if (!selectedUser) return;
    setEditFormData({
      displayName: selectedUser.displayName || '',
      phoneNumber: selectedUser.phoneNumber || '',
      email: selectedUser.email || '',
      birthdate: selectedUser.birthdate || '',
      points: selectedUser.points || 0,
      walletBalance: selectedUser.walletBalance || 0,
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      batch.update(userRef, {
        displayName: editFormData.displayName,
        phoneNumber: editFormData.phoneNumber,
        birthdate: editFormData.birthdate,
        points: editFormData.points,
        walletBalance: editFormData.walletBalance,
      });

      // Wallet Balance Transaction
      const oldWalletBalance = selectedUser.walletBalance || 0;
      if (oldWalletBalance !== editFormData.walletBalance) {
        const walletDiff = editFormData.walletBalance - oldWalletBalance;
        const walletTxRef = doc(collection(db, 'users', selectedUser.id, 'wallet_transactions'));
        batch.set(walletTxRef, {
          amount: walletDiff,
          previousBalance: oldWalletBalance,
          newBalance: editFormData.walletBalance,
          description: 'Edit by Admin',
          createdAt: new Date(),
        });
      }

      // Points Transaction
      const oldPoints = selectedUser.points || 0;
      if (oldPoints !== editFormData.points) {
        const pointsDiff = editFormData.points - oldPoints;
        const pointsTxRef = doc(collection(db, 'users', selectedUser.id, 'point_history'));
        batch.set(pointsTxRef, {
          amount: pointsDiff,
          previousPoints: oldPoints,
          newPoints: editFormData.points,
          description: 'Edit by Admin',
          createdAt: new Date(),
        });
      }

      await batch.commit();
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile changes.');
    }
  };

  const formatDate = (timestamp: FirestoreTimestamp | Date | string | number | null | undefined) => {
    if (!timestamp) {
      return 'N/A';
    }
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      const ts = timestamp as FirestoreTimestamp;
      return ts.toDate().toLocaleString();
    }
    return new Date(timestamp as string | number | Date).toLocaleString();
  };

  const formatDateOnly = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filter user records in memory
  const userOrders = selectedUserId
    ? orders
        .filter(order => order.userId === selectedUserId)
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        })
    : [];

  const userTopups = selectedUserId
    ? topups
        .filter(topup => topup.userId === selectedUserId)
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        })
    : [];

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'ready_to_pickup':
      case 'paid':
      case 'payment_received':
        return 'green';
      case 'cancelled':
      case 'failed':
        return 'red';
      case 'received':
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

  const getTopupStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending_verification': return 'orange';
      default: return 'var(--text-secondary)';
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  // Inline CSS styles
  const tabButtonStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.25rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    border: 'none',
    background: 'none',
    borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    whiteSpace: 'nowrap' as const,
  });

  const detailItemStyle = {
    background: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  const infoLabelStyle = {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    marginBottom: '0.25rem',
  };

  const infoValueStyle = {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text)',
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users Management</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
          }}>
          <UsersIcon size={20} />
          <span>{users.length} Total Users</span>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading users...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        {!loading && !error && (
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Points</th>
                <th>Wallet Balance</th>
                <th>Registered At</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                        }}>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>
                          {user.displayName || 'Anonymous'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}>
                          {user.phoneNumber || user.email || 'No Phone/Email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                      {user.points || 0} pts
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'green' }}>
                      RM {(user.walletBalance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {formatDate(user.lastLogin)}
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => handleOpenDetails(user)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.85rem',
                      }}>
                      <UserIcon size={16} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isDetailModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '950px', width: '95%' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                  }}>
                  {selectedUser.displayName ? selectedUser.displayName.charAt(0).toUpperCase() : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                    {selectedUser.displayName || 'Anonymous User'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    User ID: {selectedUser.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                marginBottom: '1.5rem',
                gap: '0.5rem',
                overflowX: 'auto',
              }}>
              <button
                style={tabButtonStyle(activeTab === 'profile')}
                onClick={() => setActiveTab('profile')}>
                <UserIcon size={16} />
                Profile & Addresses
              </button>
              <button
                style={tabButtonStyle(activeTab === 'wallet')}
                onClick={() => setActiveTab('wallet')}>
                <Wallet size={16} />
                Wallet History ({userWalletTxs.length})
              </button>
              <button
                style={tabButtonStyle(activeTab === 'points')}
                onClick={() => setActiveTab('points')}>
                <Award size={16} />
                Points History ({userPointsTxs.length})
              </button>
              <button
                style={tabButtonStyle(activeTab === 'orders')}
                onClick={() => setActiveTab('orders')}>
                <ClipboardList size={16} />
                Orders ({userOrders.length})
              </button>
              <button
                style={tabButtonStyle(activeTab === 'topups')}
                onClick={() => setActiveTab('topups')}>
                <Wallet size={16} />
                Topups ({userTopups.length})
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '350px' }}>
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary)' }}>Edit Profile</h4>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '1.25rem',
                          marginBottom: '1.5rem',
                        }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Full Name</label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={editFormData.displayName}
                            onChange={e => setEditFormData({ ...editFormData, displayName: e.target.value })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Phone Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.phoneNumber}
                            onChange={e => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Email Address (Read-only)</label>
                          <input
                            type="email"
                            className="form-control"
                            disabled
                            value={editFormData.email}
                            style={{ backgroundColor: '#e9ecef', color: '#6c757d', cursor: 'not-allowed' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Birthdate</label>
                          <input
                            type="date"
                            className="form-control"
                            value={editFormData.birthdate}
                            onChange={e => setEditFormData({ ...editFormData, birthdate: e.target.value })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Loyalty Points</label>
                          <input
                            type="number"
                            className="form-control"
                            required
                            min="0"
                            value={editFormData.points}
                            onChange={e => setEditFormData({ ...editFormData, points: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Wallet Balance (RM)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            required
                            min="0"
                            value={editFormData.walletBalance}
                            onChange={e => setEditFormData({ ...editFormData, walletBalance: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setIsEditingProfile(false)}
                          style={{ padding: '0.5rem 1.5rem' }}>
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ padding: '0.5rem 1.5rem' }}>
                          <Save size={16} /> Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>General Information</h4>
                        <button
                          className="btn-secondary"
                          onClick={startEditing}
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Edit size={14} /> Edit Profile
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '1rem',
                        }}>
                        <div style={detailItemStyle}>
                          <UserIcon size={20} color="var(--primary)" />
                          <div>
                            <div style={infoLabelStyle}>Full Name</div>
                            <div style={infoValueStyle}>{selectedUser.displayName || 'N/A'}</div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Phone size={20} color="var(--primary)" />
                          <div>
                            <div style={infoLabelStyle}>Phone Number</div>
                            <div style={infoValueStyle}>{selectedUser.phoneNumber || 'N/A'}</div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Mail size={20} color="var(--primary)" />
                          <div>
                            <div style={infoLabelStyle}>Email Address</div>
                            <div style={infoValueStyle}>{selectedUser.email || 'N/A'}</div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Calendar size={20} color="var(--primary)" />
                          <div>
                            <div style={infoLabelStyle}>Birthdate</div>
                            <div style={infoValueStyle}>{formatDateOnly(selectedUser.birthdate)}</div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Clock size={20} color="var(--primary)" />
                          <div>
                            <div style={infoLabelStyle}>Member Since</div>
                            <div style={infoValueStyle}>{formatDate(selectedUser.createdAt)}</div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Award size={20} color="var(--accent)" />
                          <div>
                            <div style={infoLabelStyle}>Loyalty Points</div>
                            <div style={{ ...infoValueStyle, color: 'var(--accent)' }}>
                              {selectedUser.points || 0} pts
                            </div>
                          </div>
                        </div>
                        <div style={detailItemStyle}>
                          <Wallet size={20} color="green" />
                          <div>
                            <div style={infoLabelStyle}>Wallet Balance</div>
                            <div style={{ ...infoValueStyle, color: 'green' }}>
                              RM {(selectedUser.walletBalance || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Saved Addresses list */}
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={20} />
                      Saved Addresses
                    </h4>
                    {addressLoading && <p>Loading addresses...</p>}
                    {!addressLoading && addresses.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px dashed var(--border)',
                          color: 'var(--text-secondary)',
                        }}>
                        <MapPinOff size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>This user hasn't saved any addresses yet.</p>
                      </div>
                    )}
                    {!addressLoading && addresses.length > 0 && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: '1rem',
                        }}>
                        {addresses.map(addr => (
                          <div
                            key={addr.id}
                            style={{
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              backgroundColor: '#f9fafb',
                            }}>
                            <div
                              style={{
                                fontWeight: 'bold',
                                color: 'var(--primary)',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                              }}>
                              {addr.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.4',
                              }}>
                              {addr.street}
                              <br />
                              {addr.postalCode} {addr.city}, {addr.state}
                              <br />
                              {addr.country}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Wallet Balance Transactions</h4>
                  {userWalletTxs.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                      }}>
                      <Wallet size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ margin: 0 }}>No wallet transactions recorded.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Change</th>
                            <th>Balance After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userWalletTxs.map(tx => {
                            const isPositive = tx.amount >= 0;
                            return (
                              <tr key={tx.id}>
                                <td style={{ fontSize: '0.85rem' }}>{formatDate(tx.createdAt)}</td>
                                <td style={{ fontWeight: '500' }}>{tx.description}</td>
                                <td style={{ color: isPositive ? 'green' : 'red', fontWeight: 'bold' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                    {isPositive ? '+' : ''}RM {tx.amount.toFixed(2)}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                  RM {tx.newBalance.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'points' && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Loyalty Points Transactions</h4>
                  {userPointsTxs.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                      }}>
                      <Award size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ margin: 0 }}>No points transactions recorded.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Change</th>
                            <th>Points After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userPointsTxs.map(tx => {
                            const isPositive = tx.amount >= 0;
                            return (
                              <tr key={tx.id}>
                                <td style={{ fontSize: '0.85rem' }}>{formatDate(tx.createdAt)}</td>
                                <td style={{ fontWeight: '500' }}>{tx.description}</td>
                                <td style={{ color: isPositive ? 'var(--accent)' : 'red', fontWeight: 'bold' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                    {isPositive ? '+' : ''}{tx.amount} pts
                                  </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                  {tx.newPoints} pts
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Order History</h4>
                  {userOrders.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                      }}>
                      <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ margin: 0 }}>No orders found for this user.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Mode</th>
                            <th>Status</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userOrders.map(order => {
                            const isExpanded = expandedOrderId === order.id;
                            return (
                              <React.Fragment key={order.id}>
                                <tr
                                  onClick={() => toggleOrderExpand(order.id)}
                                  style={{ cursor: 'pointer' }}>
                                  <td>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </td>
                                  <td style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                    {order.id.slice(0, 8)}...
                                  </td>
                                  <td style={{ fontSize: '0.85rem' }}>
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td style={{ fontWeight: 'bold' }}>
                                    RM {order.totalAmount?.toFixed(2) || '0.00'}
                                  </td>
                                  <td>{order.orderMode}</td>
                                  <td style={{ color: getOrderStatusColor(order.status), fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {order.status?.replace('_', ' ').toUpperCase()}
                                  </td>
                                  <td style={{ color: getOrderStatusColor(order.paymentStatus), fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    {order.paymentStatus?.replace('_', ' ').toUpperCase()}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={7} style={{ background: '#f8f9fa', padding: '1rem' }}>
                                      <div style={{ padding: '0.5rem 1rem' }}>
                                        <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Items Ordered:</h5>
                                        <table className="data-table" style={{ background: 'white', marginTop: 0 }}>
                                          <thead>
                                            <tr>
                                              <th>Product</th>
                                              <th style={{ textAlign: 'center' }}>Qty</th>
                                              <th style={{ textAlign: 'right' }}>Unit Price</th>
                                              <th style={{ textAlign: 'right' }}>Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {order.items?.map((item, idx) => (
                                              <tr key={idx}>
                                                <td>
                                                  <span style={{ fontWeight: '600' }}>
                                                    {item.product?.name || 'Unknown Product'}
                                                  </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                  RM {item.unitPrice?.toFixed(2)}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                                  RM {(item.quantity * item.unitPrice)?.toFixed(2)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'topups' && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Topup History</h4>
                  {userTopups.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                      }}>
                      <Wallet size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p style={{ margin: 0 }}>No topup requests found for this user.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th>Topup ID</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Bonus</th>
                            <th>Total Credit</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTopups.map(topup => (
                            <tr key={topup.id}>
                              <td style={{ fontSize: '0.85rem' }}>{topup.id.slice(0, 8)}...</td>
                              <td style={{ fontSize: '0.85rem' }}>{formatDate(topup.createdAt)}</td>
                              <td>RM {topup.amount?.toFixed(2) || '0.00'}</td>
                              <td>RM {topup.bonus?.toFixed(2) || '0.00'}</td>
                              <td style={{ fontWeight: 'bold' }}>
                                RM {topup.totalCredit?.toFixed(2) || '0.00'}
                              </td>
                              <td>{topup.paymentMethod}</td>
                              <td style={{ color: getTopupStatusColor(topup.status), fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {topup.status.replace('_', ' ').toUpperCase()}
                              </td>
                              <td>
                                {topup.receiptUrl ? (
                                  <a
                                    href={topup.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      color: 'var(--primary-light)',
                                      textDecoration: 'none',
                                      fontWeight: '600',
                                      fontSize: '0.85rem',
                                    }}>
                                    View Receipt <ExternalLink size={14} />
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '2.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
              <button
                className="btn-secondary"
                onClick={() => setIsDetailModalOpen(false)}
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

export default Users;
