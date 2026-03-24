import {useState} from 'react';
import {db} from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Plus, Edit2, Trash2, X} from 'lucide-react';

interface OptionItem {
  id: string;
  name: string;
  price: string;
}

interface OptionGroup {
  id?: string;
  name: string;
  type: 'pick_one' | 'multi_select' | 'boolean';
  options: OptionItem[];
}

const GlobalOptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [formData, setFormData] = useState<OptionGroup>({
    name: '',
    type: 'pick_one',
    options: [],
  });

  const globalOptionsRef = collection(db, 'global_options');
  const q = query(globalOptionsRef, orderBy('name', 'asc'));
  const [snapshot, loading, error] = useCollection(q);
  const groups = snapshot?.docs.map(
    doc => ({id: doc.id, ...doc.data()} as OptionGroup),
  );

  const handleOpenModal = (group?: OptionGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData(group);
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        type: 'pick_one',
        options: [{id: Date.now().toString(), name: '', price: '0'}],
      });
    }
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {id: Date.now().toString(), name: '', price: '0'},
      ],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData({...formData, options: newOptions});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup?.id) {
        const docRef = doc(db, 'global_options', editingGroup.id);
        await updateDoc(docRef, {...formData});
      } else {
        await addDoc(globalOptionsRef, {...formData});
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving global option group:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this option group?')) {
      await deleteDoc(doc(db, 'global_options', id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Global Options</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          New Group
        </button>
      </div>

      <div className="card">
        {loading && <p>Loading options...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Type</th>
              <th>Options Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups?.map(group => (
              <tr key={group.id}>
                <td>
                  <span style={{fontWeight: '600'}}>{group.name}</span>
                </td>
                <td>
                  <span
                    className="badge-type"
                    style={{
                      padding: '4px 8px',
                      background: '#eef2ff',
                      color: 'var(--primary)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                    }}>
                    {group.type.replace('_', ' ')}
                  </span>
                </td>
                <td>{group.options.length} options</td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn btn-edit"
                      onClick={() => handleOpenModal(group)}>
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="action-btn btn-delete"
                      onClick={() => handleDelete(group.id!)}>
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
          <div className="modal" style={{maxWidth: '600px'}}>
            <div className="page-header">
              <h3>{editingGroup ? 'Edit Option Group' : 'New Option Group'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}>
                <div className="form-group">
                  <label>Group Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={e =>
                      setFormData({...formData, name: e.target.value})
                    }
                    placeholder="e.g. Sugar Level"
                  />
                </div>
                <div className="form-group">
                  <label>Selection Type</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={e =>
                      setFormData({...formData, type: e.target.value as any})
                    }>
                    <option value="pick_one">Pick One (Radio)</option>
                    <option value="multi_select">
                      Multi Select (Checkbox)
                    </option>
                    <option value="boolean">Toggle (Yes/No)</option>
                  </select>
                </div>
              </div>

              <div style={{marginTop: '1.5rem'}}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                  <label style={{fontWeight: '700', fontSize: '0.9rem'}}>
                    Individual Choices
                  </label>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}}
                    onClick={handleAddOption}>
                    <Plus size={14} /> Add Choice
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    paddingRight: '0.5rem',
                  }}>
                  {formData.options.map((opt, index) => (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                        alignItems: 'center',
                      }}>
                      <div style={{flex: 2}}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Label (e.g. Less Sugar)"
                          value={opt.name}
                          onChange={e => {
                            const newOptions = [...formData.options];
                            newOptions[index].name = e.target.value;
                            setFormData({...formData, options: newOptions});
                          }}
                          required
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Price (e.g. 0.90)"
                          value={opt.price}
                          onChange={e => {
                            const newOptions = [...formData.options];
                            newOptions[index].price = e.target.value;
                            setFormData({...formData, options: newOptions});
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="action-btn btn-delete"
                        onClick={() => handleRemoveOption(index)}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
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
                  {editingGroup ? 'Update Group' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalOptions;
