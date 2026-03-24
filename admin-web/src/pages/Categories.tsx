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

interface Category {
  id?: string;
  name: string;
  icon: string;
  order: number;
}

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Category>({
    name: '',
    icon: '',
    order: 0,
  });

  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('order', 'asc'));
  const [snapshot, loading, error] = useCollection(q);
  const categories = snapshot?.docs.map(
    doc => ({id: doc.id, ...doc.data()} as Category),
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({name: '', icon: '', order: (categories?.length || 0) + 1});
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory?.id) {
        const docRef = doc(db, 'categories', editingCategory.id);
        await updateDoc(docRef, {...formData});
      } else {
        await addDoc(categoriesRef, {...formData});
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="card">
        {loading && <p>Loading categories...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Icon</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map(cat => (
              <tr key={cat.id}>
                <td style={{width: '80px', fontWeight: 'bold'}}>{cat.order}</td>
                <td>
                  <span style={{fontSize: '1.25rem'}}>{cat.icon}</span>
                </td>
                <td>
                  <span style={{fontWeight: '500'}}>{cat.name}</span>
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn btn-edit"
                      onClick={() => handleOpenModal(cat as Category)}>
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="action-btn btn-delete"
                      onClick={() => handleDelete(cat.id!)}>
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
              <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({...formData, name: e.target.value})
                  }
                  placeholder="e.g. Grape Series"
                />
              </div>
              <div className="form-group">
                <label>Icon (Emoji or Icon Name)</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.icon}
                  onChange={e =>
                    setFormData({...formData, icon: e.target.value})
                  }
                  placeholder="e.g. 🍇"
                />
              </div>
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
