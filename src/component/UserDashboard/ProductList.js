// Products.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
} from 'react-icons/fa';

export default function Products() {
  const storeId = localStorage.getItem('store_id');
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    purchase_price: '',
    markup_percent: '',
  });

  // Memoized fetch to satisfy useEffect deps
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, purchase_price, markup_percent, selling_price, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (!error) {
      setProducts(data);
      setFiltered(data);
    }
  }, [storeId]);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search filtering
  useEffect(() => {
    if (!search) setFiltered(products);
    else {
      const q = search.toLowerCase();
      setFiltered(
        products.filter(p => p.name.toLowerCase().includes(q))
      );
    }
  }, [search, products]);

  // Handlers
  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddChange = e => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const createProduct = async e => {
    e.preventDefault();
    await supabase
      .from('products')
      .insert([{ store_id: storeId, ...addForm }]);
    setShowAdd(false);
    setAddForm({ name: '', description: '', purchase_price: '', markup_percent: '' });
    fetchProducts();
  };

  const startEdit = p => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      markup_percent: p.markup_percent,
    });
  };

  const saveEdit = async () => {
    await supabase
      .from('products')
      .update(form)
      .eq('id', editing.id);
    setEditing(null);
    fetchProducts();
  };

  const deleteProduct = async p => {
    if (window.confirm(`Delete product "${p.name}"?`)) {
      await supabase.from('products').delete().eq('id', p.id);
      fetchProducts();
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Description,Purchase Price,Markup %,Selling Price,Created At\n";
    filtered.forEach(p => {
      const row = [
        p.name,
        (p.description || '').replace(/,/g, ' '),
        p.purchase_price.toFixed(2),
        p.markup_percent.toFixed(2),
        p.selling_price.toFixed(2),
        p.created_at,
      ].join(',');
      csv += row + "\n";
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Products List', 10, y);
      y += 10;
      filtered.forEach(p => {
        const line = `Name: ${p.name}, Purchase: ${p.purchase_price.toFixed(2)}, Markup: ${p.markup_percent.toFixed(2)}%, Sell: ${p.selling_price.toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('products.pdf');
    });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <FaPlus /> Add Product
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <FaFileCsv /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form onSubmit={createProduct} className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            {['name','description','purchase_price','markup_percent'].map(field => (
              <div className="mb-3" key={field}>
                <label className="block mb-1 capitalize">{field.replace('_',' ')}</label>
                <input
                  type={field.includes('price')||field.includes('percent') ? 'number' : 'text'}
                  step="0.01"
                  name={field}
                  value={addForm[field]}
                  onChange={handleAddChange}
                  required={field==='name' || field==='purchase_price'}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              {['Name','Description','Purchase','Markup %','Selling','Created','Actions'].map(h => (
                <th key={h} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.description}</td>
                <td className="p-2">{p.purchase_price.toFixed(2)}</td>
                <td className="p-2">{p.markup_percent.toFixed(2)}</td>
                <td className="p-2">{p.selling_price.toFixed(2)}</td>
                <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-2 flex items-center space-x-2">
                  <button onClick={() => startEdit(p)} aria-label="Edit product" className="p-1 hover:bg-gray-200 rounded"><FaEdit className="text-indigo-600" /></button>
                  <button onClick={() => deleteProduct(p)} aria-label="Delete product" className="p-1 hover:bg-gray-200 rounded"><FaTrashAlt className="text-red-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit {editing.name}</h2>
            {['name','description','purchase_price','markup_percent'].map(field => (
              <div className="mb-3" key={field}>
                <label className="block mb-1 capitalize">{field.replace('_',' ')}</label>
                <input
                  type={field.includes('price')||field.includes('percent') ? 'number' : 'text'}
                  step="0.01"
                  name={field}
                  value={form[field]}
                  onChange={handleFormChange}
                  required={field==='name' || field==='purchase_price'}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}