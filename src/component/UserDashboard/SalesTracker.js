// SalesTracker.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
} from 'react-icons/fa';

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');

  // State lists
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  // Add sale UI
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    payment_method: '',
  });

  // Edit sale UI
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    payment_method: '',
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, selling_price')
      .eq('store_id', storeId)
      .order('name', { ascending: true });
    if (!error) setProducts(data);
  }, [storeId]);

  // Fetch sales
  const fetchSales = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('sales')
      .select('id, product_id, quantity, unit_price, amount, sold_at, payment_method, products(name)')
      .eq('store_id', storeId)
      .order('sold_at', { ascending: false });
    if (!error) {
      setSales(data);
      setFiltered(data);
    }
  }, [storeId]);

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);

  // Search filter
  useEffect(() => {
    if (!search) setFiltered(sales);
    else {
      const q = search.toLowerCase();
      setFiltered(
        sales.filter(s =>
          s.products.name.toLowerCase().includes(q) ||
          s.payment_method.toLowerCase().includes(q)
        )
      );
    }
  }, [search, sales]);

  // Handlers for add form
  const handleAddChange = e => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
    if (name === 'product_id') {
      const prod = products.find(p => p.id === +value);
      if (prod) setAddForm(prev => ({ ...prev, unit_price: prod.selling_price }));
    }
  };

  const createSale = async e => {
    e.preventDefault();
    await supabase.from('sales').insert([{ store_id: storeId, ...addForm }]);
    setShowAdd(false);
    setAddForm({ product_id: '', quantity: '', unit_price: '', payment_method: '' });
    fetchSales();
  };

  // Handlers for edit form
  const startEdit = s => {
    setEditing(s.id);
    setEditForm({
      product_id: s.product_id,
      quantity: s.quantity,
      unit_price: s.unit_price,
      payment_method: s.payment_method,
    });
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    if (name === 'product_id') {
      const prod = products.find(p => p.id === +value);
      if (prod) setEditForm(prev => ({ ...prev, unit_price: prod.selling_price }));
    }
  };

  const saveEdit = async () => {
    await supabase.from('sales').update(editForm).eq('id', editing);
    setEditing(null);
    fetchSales();
  };

  const deleteSale = async s => {
    if (window.confirm(`Delete sale #${s.id}?`)) {
      await supabase.from('sales').delete().eq('id', s.id);
      fetchSales();
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Product,Quantity,Unit Price,Amount,Payment Method,Sold At\n';
    filtered.forEach(s => {
      const row = [
        s.products.name,
        s.quantity,
        s.unit_price.toFixed(2),
        s.amount.toFixed(2),
        s.payment_method,
        s.sold_at,
      ].join(',');
      csv += row + '\n';
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', 'sales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Sales Report', 10, y); y += 10;
      filtered.forEach(s => {
        const line = `Product: ${s.products.name}, Qty: ${s.quantity}, Unit: ${s.unit_price.toFixed(2)}, Amt: ${s.amount.toFixed(2)}, Payment: ${s.payment_method}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('sales.pdf');
    });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search sales..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <FaPlus /> Add Sale
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <FaFileCsv /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form onSubmit={createSale} className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Sale</h2>
            <div className="mb-3">
              <label className="block mb-1">Product</label>
              <select
                name="product_id"
                value={addForm.product_id}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={addForm.quantity}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-3">
              <label className="block mb-1">Unit Price</label>
              <input
                type="number"
                name="unit_price"
                value={addForm.unit_price}
                readOnly
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={addForm.payment_method}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select method</option>
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Mobile Payment</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              {['Product','Quantity','Unit Price','Amount','Payment','Sold At','Actions'].map(h => (
                <th key={h} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{s.products.name}</td>
                <td className="p-2">{s.quantity}</td>
                <td className="p-2">{s.unit_price.toFixed(2)}</td>
                <td className="p-2">{s.amount.toFixed(2)}</td>
                <td className="p-2">{s.payment_method}</td>
                <td className="p-2">{new Date(s.sold_at).toLocaleString()}</td>
                <td className="p-2 flex items-center space-x-2">
                  <button onClick={() => startEdit(s)} aria-label="Edit sale" className="p-1 hover:bg-gray-200 rounded"><FaEdit className="text-indigo-600" /></button>
                  <button onClick={() => deleteSale(s)} aria-label="Delete sale" className="p-1 hover:bg-gray-200 rounded"><FaTrashAlt className="text-red-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Sale Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form onSubmit={e => { e.preventDefault(); saveEdit(); }} className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Sale</h2>
            <div className="mb-3">
              <label className="block mb-1">Product</label>
              <select name="product_id" value={editForm.product_id} onChange={handleEditChange} required className="w-full p-2 border rounded">
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block mb-1">Quantity</label>
              <input type="number" name="quantity" min="1" value={editForm.quantity} onChange={handleEditChange} required className="w-full p-2 border rounded" />
            </div>
            <div className="mb-3">
              <label className="block mb-1">Unit Price</label>
              <input type="number" name="unit_price" value={editForm.unit_price} readOnly className="w-full p-2 border rounded bg-gray-100" />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Payment Method</label>
              <select name="payment_method" value={editForm.payment_method} onChange={handleEditChange} required className="w-full p-2 border rounded">
                <option>Cash</option>
                <option>Credit Card</option>
                <option>Mobile Payment</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}