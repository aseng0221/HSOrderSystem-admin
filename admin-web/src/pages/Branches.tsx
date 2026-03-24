import {useState} from 'react';
import {db} from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Plus, Edit2, Trash2, X, Database, MapPin} from 'lucide-react';
import type {Branch} from '../types/branch';

const MOCK_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'HS Coffee Bintang Megamall',
    address: 'Lot G.01, Ground Floor, Bintang Megamall, Miri',
    latitude: 4.4005,
    longitude: 113.992,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
  },
  {
    id: '2',
    name: 'HS Coffee Boulevard',
    address: 'Boulevard Shopping Complex, Jalan Pujut, Miri',
    latitude: 4.415,
    longitude: 114.015,
    openTime: '09:00 AM',
    closeTime: '10:30 PM',
  },
  {
    id: '3',
    name: 'HS Coffee Imperial City',
    address: 'Imperial City Mall, Jalan Merpati, Miri',
    latitude: 4.398,
    longitude: 113.991,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
  },
  {
    id: '4',
    name: 'HS Coffee Lutong',
    address: 'Jalan Pasar Lutong, Lutong, Miri',
    latitude: 4.475,
    longitude: 114.005,
    openTime: '07:30 AM',
    closeTime: '09:00 PM',
  },
  {
    id: '5',
    name: 'HS Coffee Senadin',
    address: 'Senadin Gateway, Miri',
    latitude: 4.512,
    longitude: 114.018,
    openTime: '08:00 AM',
    closeTime: '11:00 PM',
  },
  {
    id: '6',
    name: 'HS Coffee Marina ParkCity',
    address: 'Marina Square 1, Marina ParkCity, Miri',
    latitude: 4.395,
    longitude: 113.985,
    openTime: '08:00 AM',
    closeTime: '12:00 AM',
  },
  {
    id: '7',
    name: 'HS Coffee Pelita',
    address: 'Pelita Commercial Centre, Miri',
    latitude: 4.408,
    longitude: 113.998,
    openTime: '07:00 AM',
    closeTime: '10:00 PM',
  },
  {
    id: '8',
    name: 'HS Coffee Permyjaya',
    address: 'Permy Mall, Bandar Baru Permyjaya, Miri',
    latitude: 4.445,
    longitude: 114.025,
    openTime: '09:00 AM',
    closeTime: '10:00 PM',
  },
  {
    id: '9',
    name: 'HS Coffee Luak Esplanade',
    address: 'Luak Bay, Miri',
    latitude: 4.345,
    longitude: 113.97,
    openTime: '08:00 AM',
    closeTime: '11:00 PM',
  },
  {
    id: '10',
    name: 'HS Coffee Krokop',
    address: 'Jalan Krokop Utama, Miri',
    latitude: 4.412,
    longitude: 114.008,
    openTime: '06:30 AM',
    closeTime: '06:00 PM',
  },
];

const Branches = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    openTime: '08:00 AM',
    closeTime: '10:00 PM',
  });

  const branchesRef = collection(db, 'branches');
  const [snapshot, loading, error] = useCollection(branchesRef);
  const branches = snapshot?.docs.map(
    doc => ({id: doc.id, ...doc.data()} as Branch),
  );

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        latitude: 4.3995,
        longitude: 113.9914,
        openTime: '08:00 AM',
        closeTime: '10:00 PM',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch?.id) {
        const docRef = doc(db, 'branches', editingBranch.id);
        await updateDoc(docRef, {...formData});
      } else {
        await addDoc(branchesRef, {...formData});
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving branch:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      await deleteDoc(doc(db, 'branches', id));
    }
  };

  const seedData = async () => {
    if (
      window.confirm(
        'This will seed 10 mock branches into Firestore. Continue?',
      )
    ) {
      try {
        for (const branch of MOCK_BRANCHES) {
          await setDoc(doc(db, 'branches', branch.id), branch);
        }
        alert('Branches seeded successfully!');
      } catch (err) {
        console.error('Error seeding data:', err);
        alert('Error seeding data. Check console.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Outlets Management</h1>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button
            className="btn-secondary"
            onClick={seedData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
            <Database size={18} />
            Seed Mock Data
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Add Outlet
          </button>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading outlets...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Location</th>
              <th>Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches?.map(branch => (
              <tr key={branch.id}>
                <td>
                  <span style={{fontWeight: '600', color: 'var(--primary)'}}>
                    {branch.name}
                  </span>
                </td>
                <td
                  style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                  {branch.address}
                </td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8rem',
                    }}>
                    <MapPin size={14} />
                    {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                  </div>
                </td>
                <td style={{fontSize: '0.85rem'}}>
                  {branch.openTime} - {branch.closeTime}
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn btn-edit"
                      onClick={() => handleOpenModal(branch)}>
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="action-btn btn-delete"
                      onClick={() => handleDelete(branch.id!)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="page-header">
              <h3>{editingBranch ? 'Edit Outlet' : 'New Outlet'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Outlet Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({...formData, name: e.target.value})
                  }
                  placeholder="e.g. HS Coffee Miri"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.address}
                  onChange={e =>
                    setFormData({...formData, address: e.target.value})
                  }
                />
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    required
                    value={formData.latitude}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    required
                    value={formData.longitude}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Open Time</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.openTime}
                    onChange={e =>
                      setFormData({...formData, openTime: e.target.value})
                    }
                    placeholder="08:00 AM"
                  />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Close Time</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.closeTime}
                    onChange={e =>
                      setFormData({...formData, closeTime: e.target.value})
                    }
                    placeholder="10:00 PM"
                  />
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setIsModalOpen(false)}
                  style={{flex: 1, border: '1px solid var(--border)'}}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{flex: 2, justifyContent: 'center'}}>
                  {editingBranch ? 'Update Outlet' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
