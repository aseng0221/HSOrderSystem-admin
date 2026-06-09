import {useState} from 'react';
import {db} from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {Plus, Edit2, Trash2, X} from 'lucide-react';

interface OptionItem {
  id: string;
  name: string;
  price: string;
  isDefault?: boolean;
}

interface OptionGroup {
  id?: string;
  name: string;
  type: 'pick_one' | 'multi_select' | 'boolean';
  options: OptionItem[];
  order: number;
  required?: boolean;
}

const GlobalOptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [formData, setFormData] = useState<OptionGroup>({
    name: '',
    type: 'pick_one',
    options: [],
    order: 0,
    required: false,
  });

  const globalOptionsRef = collection(db, 'global_options');
  const q = query(globalOptionsRef);
  const [snapshot, loading, error] = useCollection(q);
  const groups = snapshot?.docs.map(
    doc => ({id: doc.id, ...doc.data()} as OptionGroup),
  )?.sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleOpenModal = (group?: OptionGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormData(group);
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        type: 'pick_one',
        options: [{id: Date.now().toString(), name: '', price: '0', isDefault: false}],
        order: (groups?.length || 0) + 1,
        required: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {id: Date.now().toString(), name: '', price: '0', isDefault: false},
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
              <th>Order</th>
              <th>Group Name</th>
              <th>Type</th>
              <th>Options Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups?.map(group => (
              <tr key={group.id}>
                <td style={{ width: '80px', fontWeight: 'bold' }}>
                  {group.order}
                </td>
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
                  gridTemplateColumns: '1fr 2fr 2fr auto',
                  gap: '1rem',
                }}>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={formData.order}
                    onChange={e =>
                      setFormData({...formData, order: parseInt(e.target.value)})
                    }
                  />
                </div>
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
                      setFormData({...formData, type: e.target.value as 'pick_one' | 'multi_select' | 'boolean'})
                    }>
                    <option value="pick_one">Pick One (Radio)</option>
                    <option value="multi_select">
                      Multi Select (Checkbox)
                    </option>
                    <option value="boolean">Toggle (Yes/No)</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.required || false}
                      onChange={e => setFormData({...formData, required: e.target.checked})}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Is Mandatory?
                  </label>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px' }}>
                        <input
                          type={formData.type === 'pick_one' ? 'radio' : 'checkbox'}
                          name="isDefaultGroup"
                          checked={opt.isDefault || false}
                          title="Set as Default Option"
                          onChange={e => {
                            const newOptions = [...formData.options];
                            if (formData.type === 'pick_one' && e.target.checked) {
                              newOptions.forEach(o => o.isDefault = false);
                            }
                            newOptions[index].isDefault = e.target.checked;
                            setFormData({...formData, options: newOptions});
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </div>
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
