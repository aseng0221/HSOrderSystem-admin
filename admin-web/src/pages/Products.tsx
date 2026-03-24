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
  where,
} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Filter,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import {storage} from '../firebase';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';

interface Product {
  id?: string;
  categoryId: string;
  name: string;
  price: string;
  tag: string;
  order: number;
  description?: string;
  image?: string;
  globalOptions?: string[]; // IDs of global option groups
}

const Products = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState<Product>({
    categoryId: '',
    name: '',
    price: 'RM 0.00',
    tag: '',
    image: '',
    order: 0,
    description: '',
    globalOptions: [],
  });
  const [uploading, setUploading] = useState(false);

  const productsRef = collection(db, 'products');
  const categoriesRef = collection(db, 'categories');
  const globalOptionsRef = collection(db, 'global_options');

  // Fetch categories for the dropdown and filter
  const [catSnapshot] = useCollection(
    query(categoriesRef, orderBy('order', 'asc')),
  );
  const categories = catSnapshot?.docs.map(
    d => ({id: d.id, ...d.data()} as any),
  );

  // Fetch global options for the multi-select
  const [globalSnapshot] = useCollection(
    query(globalOptionsRef, orderBy('name', 'asc')),
  );
  const allGlobalOptions = globalSnapshot?.docs.map(
    d => ({id: d.id, ...d.data()} as any),
  );

  // Fetch products based on filter
  const productQuery =
    filterCategory === 'all'
      ? query(productsRef, orderBy('order', 'asc'))
      : query(
          productsRef,
          where('categoryId', '==', filterCategory),
          orderBy('order', 'asc'),
        );

  const [prodSnapshot, loading, error] = useCollection(productQuery);
  const products = prodSnapshot?.docs.map(
    d => ({id: d.id, ...d.data()} as Product),
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        categoryId: categories?.[0]?.id || '',
        name: '',
        price: 'RM ',
        tag: '',
        image: '',
        order: (products?.length || 0) + 1,
        description: '',
        globalOptions: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({...prev, image: url}));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct?.id) {
        const docRef = doc(db, 'products', editingProduct.id);
        await updateDoc(docRef, {...formData});
      } else {
        await addDoc(productsRef, {...formData});
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
            <Filter
              size={18}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--text-secondary)',
              }}
            />
            <select
              className="form-control"
              style={{paddingLeft: '2.5rem', width: '200px'}}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading products...</p>}
        {error && <p className="text-error">Error: {error.message}</p>}

        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Photo</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Tag</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map(prod => (
              <tr key={prod.id}>
                <td style={{width: '80px', fontWeight: 'bold'}}>
                  {prod.order}
                </td>
                <td>
                  {prod.image ? (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                      }}>
                      <ImageIcon size={18} color="var(--text-secondary)" />
                    </div>
                  )}
                </td>
                <td>
                  <span style={{fontWeight: '600'}}>{prod.name}</span>
                </td>
                <td>
                  <span
                    className="badge-category"
                    style={{
                      padding: '4px 8px',
                      background: '#eef2ff',
                      color: 'var(--primary)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}>
                    {categories?.find(c => c.id === prod.categoryId)?.name ||
                      'Unknown'}
                  </span>
                </td>
                <td>{prod.price}</td>
                <td>
                  {prod.tag && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#B8860B',
                        background: '#FFFACD',
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}>
                      {prod.tag}
                    </span>
                  )}
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn btn-edit"
                      onClick={() => handleOpenModal(prod as Product)}>
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="action-btn btn-delete"
                      onClick={() => handleDelete(prod.id!)}>
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
              <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
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
                  <label>Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={e =>
                      setFormData({...formData, name: e.target.value})
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    required
                    value={formData.categoryId}
                    onChange={e =>
                      setFormData({...formData, categoryId: e.target.value})
                    }>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}>
                <div className="form-group">
                  <label>Price (Formatted)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.price}
                    onChange={e =>
                      setFormData({...formData, price: e.target.value})
                    }
                    placeholder="e.g. RM 11.20"
                  />
                </div>
                <div className="form-group">
                  <label>Tag (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tag}
                    onChange={e =>
                      setFormData({...formData, tag: e.target.value})
                    }
                    placeholder="e.g. MUST TRY"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: '#f8f9fa',
                    position: 'relative',
                    marginBottom: '1rem',
                  }}>
                  {formData.image ? (
                    <div
                      style={{position: 'relative', display: 'inline-block'}}>
                      <img
                        src={formData.image}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '150px',
                          borderRadius: '8px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, image: ''})}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '50%',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.5rem',
                        }}>
                        {uploading ? (
                          <Loader2
                            className="animate-spin"
                            size={24}
                            color="var(--primary)"
                          />
                        ) : (
                          <ImageIcon size={24} color="var(--text-secondary)" />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--text)',
                        }}>
                        {uploading
                          ? 'Uploading...'
                          : 'Click or drop image to upload'}
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                        }}>
                        PNG, JPG or WebP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional Override)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.image}
                    onChange={e =>
                      setFormData({...formData, image: e.target.value})
                    }
                    placeholder="https://example.com/image.png"
                  />
                </div>
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

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  style={{minHeight: '80px', resize: 'vertical'}}
                  value={formData.description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      description: e.target.value ?? '',
                    })
                  }
                  placeholder="Tell us about this drink..."
                />
              </div>

              <div className="form-group">
                <label style={{marginBottom: '0.75rem', display: 'block'}}>
                  Linked Global Options
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}>
                  {allGlobalOptions?.map(group => (
                    <label
                      key={group.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}>
                      <input
                        type="checkbox"
                        checked={formData.globalOptions?.includes(group.id)}
                        onChange={e => {
                          const current = formData.globalOptions || [];
                          const next = e.target.checked
                            ? [...current, group.id]
                            : current.filter(id => id !== group.id);
                          setFormData({...formData, globalOptions: next});
                        }}
                      />
                      {group.name}
                    </label>
                  ))}
                  {(!allGlobalOptions || allGlobalOptions.length === 0) && (
                    <p
                      style={{
                        gridColumn: '1/-1',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                      }}>
                      No global options found. Create some in the "Global
                      Options" tab.
                    </p>
                  )}
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
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
