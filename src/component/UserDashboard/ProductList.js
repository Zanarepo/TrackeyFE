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

  // Data & UI state
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

  // Pagination state
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Fetch products
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
      setPage(0);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search filter resets to first page
  useEffect(() => {
    const q = search.toLowerCase();
    const results = !search
      ? products
      : products.filter(p => p.name.toLowerCase().includes(q));
    setFiltered(results);
    setPage(0);
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
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'products.csv';
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

  // Pagination slice
  const start = page * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
   <div className="p-0">
        {/* Header */}
       
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4 w-full">
    <input
      type="text"
      placeholder="Search products..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
    />
  
    <div className="mt-2 sm:mt-0 sm:w-auto w-full">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        <FaPlus /> Add
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
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[600px] bg-white rounded shadow dark:bg-gray-800 dark:text-white">  <thead>
            <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
              {['Name','Desc.','Purchase','Markup %','Price','Date','Actions'].map(h => (
                <th key={h} className="p-2 text-left ">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.description}</td>
                <td className="p-2">{p.purchase_price.toFixed(2)}</td>
                <td className="p-2">{p.markup_percent.toFixed(2)}</td>
                <td className="p-2">{p.selling_price.toFixed(2)}</td>
                <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-2 flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-indigo-600 hover:text-indigo-800 p-1 rounded"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
        >
          Prev
        </button>
        <span  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-900 dark:text-white">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
        >
          Next
        </button>
        
      </div> <br/>
      {/* Export Buttons */}

<div className="w-full flex justify-center mt-4">
  <div className="flex flex-row flex-wrap justify-center gap-4">
    <button
      onClick={exportCSV}
      className="flex justify-center items-center gap-1 w-24 sm:w-32 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
    >
      <FaFileCsv className="w-4 h-4" />
      <span className="text-base">CSV</span>
    </button>

    <button
      onClick={exportPDF}
      className="flex justify-center items-center gap-1 w-24 sm:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
    >
      <FaFilePdf className="w-4 h-4" />
      <span className="text-base">PDF</span>
    </button>
  </div>
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
                  value={form[field] || ''}
                  onChange={handleFormChange}
                  required={field==='name' || field==='purchase_price'}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
