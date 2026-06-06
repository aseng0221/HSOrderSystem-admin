import {useState} from 'react';
import {db} from '../firebase';
import {collection, deleteDoc, doc, updateDoc} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Users as UsersIcon, MapPin, X, User as UserIcon, Trash2, Edit2} from 'lucide-react';

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
  phoneNumber?: string;
  email?: string;
  createdAt?: any;
  lastLogin?: any;
}

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Fetch Users
  const usersRef = collection(db, 'users');
  const [snapshot, loading, error] = useCollection(usersRef);
  const users =
    snapshot?.docs.map(doc => ({id: doc.id, ...doc.data()} as UserData)) || [];

  // Fetch addresses for selected user
  const addressesRef = selectedUser
    ? collection(db, 'users', selectedUser.id, 'addresses')
    : null;
  const [addressSnapshot, addressLoading] = useCollection(addressesRef);
  const addresses =
    addressSnapshot?.docs.map(
      doc => ({id: doc.id, ...doc.data()} as UserAddress),
    ) || [];

  const handleViewAddresses = (user: UserData) => {
    setSelectedUser(user);
    setIsAddressModalOpen(true);
    setEditingAddress(null);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) {
      return 'N/A';
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user.');
      }
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editingAddress) return;

    try {
      const addressDocRef = doc(db, 'users', selectedUser.id, 'addresses', editingAddress.id);
      await updateDoc(addressDocRef, {
        name: editingAddress.name,
        street: editingAddress.street,
        city: editingAddress.city,
        state: editingAddress.state,
        postalCode: editingAddress.postalCode,
        country: editingAddress.country,
      });
      setEditingAddress(null);
    } catch (err) {
      console.error('Error updating address:', err);
      alert('Failed to update address.');
    }
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
                <th>User</th>
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
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                        }}>
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <div style={{fontWeight: '600'}}>
                          {user.phoneNumber || user.email || 'Anonymous'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}>
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{fontSize: '0.85rem'}}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{fontSize: '0.85rem'}}>
                    {formatDate(user.lastLogin)}
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button
                        className="btn-secondary"
                        onClick={() => handleViewAddresses(user)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                        }}>
                        <MapPin size={16} />
                        View Addresses
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
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

      {isAddressModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth: '600px'}}>
            <div className="page-header">
              <div
                style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <MapPin size={24} color="var(--primary)" />
                <div>
                  <h3 style={{margin: 0}}>Saved Addresses</h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}>
                    For {selectedUser.phoneNumber || selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{marginTop: '1.5rem'}}>
              {addressLoading && <p>Loading addresses...</p>}
              {!addressLoading && addresses.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)',
                  }}>
                  <MapPin
                    size={48}
                    style={{opacity: 0.3, marginBottom: '1rem'}}
                  />
                  <p>This user hasn't saved any addresses yet.</p>
                </div>
              )}
              {!addressLoading && addresses.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
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
                      {editingAddress?.id === addr.id ? (
                        <form onSubmit={handleUpdateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                           <input
                              className="form-input"
                              value={editingAddress.name}
                              onChange={e => setEditingAddress({...editingAddress, name: e.target.value})}
                              placeholder="Name (e.g. Home, Work)"
                              required
                            />
                            <input
                              className="form-input"
                              value={editingAddress.street}
                              onChange={e => setEditingAddress({...editingAddress, street: e.target.value})}
                              placeholder="Street Address"
                              required
                            />
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                className="form-input"
                                style={{ flex: 1 }}
                                value={editingAddress.city}
                                onChange={e => setEditingAddress({...editingAddress, city: e.target.value})}
                                placeholder="City"
                                required
                              />
                               <input
                                className="form-input"
                                style={{ flex: 1 }}
                                value={editingAddress.state}
                                onChange={e => setEditingAddress({...editingAddress, state: e.target.value})}
                                placeholder="State"
                                required
                              />
                            </div>
                             <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                className="form-input"
                                style={{ flex: 1 }}
                                value={editingAddress.postalCode}
                                onChange={e => setEditingAddress({...editingAddress, postalCode: e.target.value})}
                                placeholder="Postal Code"
                                required
                              />
                               <input
                                className="form-input"
                                style={{ flex: 1 }}
                                value={editingAddress.country}
                                onChange={e => setEditingAddress({...editingAddress, country: e.target.value})}
                                placeholder="Country"
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1rem' }}>
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setEditingAddress(null)}
                                style={{ padding: '0.4rem 1rem' }}>
                                Cancel
                              </button>
                            </div>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div
                              style={{
                                fontWeight: 'bold',
                                color: 'var(--primary)',
                                marginBottom: '0.25rem',
                              }}>
                              {addr.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.4',
                              }}>
                              {addr.street}
                              <br />
                              {addr.postalCode} {addr.city}, {addr.state},{' '}
                              {addr.country}
                            </div>
                          </div>
                          <button
                            className="btn-secondary"
                            onClick={() => setEditingAddress(addr)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.8rem',
                            }}>
                            <Edit2 size={14} />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
              <button
                className="btn-primary"
                onClick={() => setIsAddressModalOpen(false)}
                style={{padding: '0.6rem 2rem'}}>
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
