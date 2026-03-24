import {useState} from 'react';
import {db} from '../firebase';
import {collection} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Users as UsersIcon, MapPin, X, User as UserIcon} from 'lucide-react';

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
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) {
      return 'N/A';
    }
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
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
