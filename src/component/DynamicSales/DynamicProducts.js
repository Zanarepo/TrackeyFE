// DynamicProducts.jsx
import React, { useState, useEffect, useCallback , useMemo} from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
} from 'react-icons/fa';

export default function DynamicProducts() {
  const storeId = localStorage.getItem('store_id');

  // State
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  // Add‑product UI
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    purchase_price: '',
    markup_percent: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;

const paginatedProducts = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
}, [filtered, currentPage]);
const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Edit‑product UI
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [priceEditable, setPriceEditable] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, markup_percent, selling_price, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (!error) {
      setProducts(data);
      setFiltered(data);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search filter
  useEffect(() => {
    if (!search) setFiltered(products);
    else {
      const q = search.toLowerCase();
      setFiltered(products.filter(p => p.name.toLowerCase().includes(q)));
    }
  }, [search, products]);

  // Handlers
  const handleAddChange = e => {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
  };

  const createProduct = async e => {
    e.preventDefault();
    // compute selling_price from purchase & markup
    const purchase = parseFloat(addForm.purchase_price);
    const markup = parseFloat(addForm.markup_percent) || 0;
    const selling = purchase * (1 + markup / 100);
    await supabase
      .from('dynamic_product')
      .insert([{
        store_id: storeId,
        ...addForm,
        markup_percent: markup,
        selling_price: selling,
      }]);
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
      selling_price: p.selling_price,
    });
    setPriceEditable(false);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const saveEdit = async () => {
    // if selling_price was edited, recompute markup_percent
    let markup = parseFloat(form.markup_percent);
    let selling = parseFloat(form.selling_price);
    const purchase = parseFloat(form.purchase_price);
    if (priceEditable) {
      markup = ((selling - purchase) / purchase) * 100;
    } else {
      selling = purchase * (markup / 100 + 1);
    }
    await supabase
      .from('dynamic_product')
      .update({
        name: form.name,
        description: form.description,
        purchase_price: parseFloat(form.purchase_price),
        markup_percent: markup,
        selling_price: selling,
      })
      .eq('id', editing.id);
    setEditing(null);
    fetchProducts();
  };

  const deleteProduct = async p => {
    if (window.confirm(`Delete product "${p.name}"?`)) {
      await supabase
        .from('dynamic_product')
        .delete()
        .eq('id', p.id);
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
        (p.description||'').replace(/,/g,' '),
        p.purchase_price.toFixed(2),
        p.markup_percent.toFixed(2),
        p.selling_price.toFixed(2),
        p.created_at
      ].join(',');
      csv += row + "\n";
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', 'dynamic_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Dynamic Products', 10, y);
      y += 10;
      filtered.forEach(p => {
        const line = `Name: ${p.name}, Purchase: ${p.purchase_price.toFixed(2)}, Markup: ${p.markup_percent.toFixed(2)}%, Sell: ${p.selling_price.toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('dynamic_products.pdf');
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
          className="flex-1 p-2 border rounded dark:bg-gray-900 dark:text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <FaPlus /> Add
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaFileCsv /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 mt-20 ">
          <form
            onSubmit={createProduct}
            className="bg-white p-6 rounded shadow w-full max-w-md dark:bg-gray-900 dark:text-white"
          >
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            {['name','description','purchase_price','markup_percent'].map(field => (
              <div className="mb-3" key={field}>
                <label className="block mb-1 capitalize">
                  {field.replace('_',' ')}
                </label>
                <input
                  type={field.includes('price')||field.includes('percent')?'number':'text'}
                  step="0.01"
                  name={field}
                  value={addForm[field]}
                  onChange={handleAddChange}
                  required={['name','purchase_price'].includes(field)}
                  className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow dark:bg-gray-900 dark:text-white ">
          <thead>
          <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
              {['Name','Description','Purchase','Markup %','Selling','Created','Actions'].map(h => (
                <th key={h} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
          {paginatedProducts.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50 dark:bg-gray-900 dark:text-white">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.description}</td>
                <td className="p-2">{p.purchase_price.toFixed(2)}</td>
                <td className="p-2">{p.markup_percent.toFixed(2)}</td>
                <td className="p-2 flex items-center space-x-2">
                  <input
                    type="number"
                    value={(editing?.id===p.id ? form.selling_price : p.selling_price).toFixed(2)}
                    readOnly
                    className="w-24 p-1 border rounded bg-gray-100 dark:bg-gray-900 dark:text-white"
                  />
                </td>
                <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-2 flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FaEdit className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FaTrashAlt className="text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
  <button
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    Prev
  </button>
  {[...Array(totalPages)].map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
    >
      {i + 1}
    </button>
  ))}
  <button
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    Next
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
                <label className="block mb-1 capitalize">
                  {field.replace('_',' ')}
                </label>
                <input
                  type={field.includes('price')||field.includes('percent')?'number':'text'}
                  step="0.01"
                  name={field}
                  value={form[field]}
                  onChange={handleFormChange}
                  required={field==='name' || field==='purchase_price'}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}

            {/* Selling Price with edit toggle */}
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex-1">
                <label className="block mb-1">selling price</label>
                <input
                  type="number"
                  name="selling_price"
                  value={form.selling_price}
                  onChange={handleFormChange}
                  readOnly={!priceEditable}
                  className={`w-full p-2 border rounded ${
                    !priceEditable ? 'bg-gray-100' : ''
                  }`}
                />
              </div>
              <button
                onClick={() => setPriceEditable(v => !v)}
                className="p-2 text-gray-600 hover:text-indigo-600"
                title="Edit selling price"
              >
                <FaEdit />
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(null);
                  setPriceEditable(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
