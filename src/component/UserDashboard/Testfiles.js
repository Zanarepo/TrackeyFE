// DynamicProducts.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Add-product UI
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    purchase_price: '',
    purchase_qty: '',
    markup_percent: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Edit-product UI
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [priceEditable, setPriceEditable] = useState(false);

  // Helper: calculate selling price
  const calcSelling = ({ purchase_price, purchase_qty, markup_percent }) => {
    const p = parseFloat(purchase_price) || 0;
    const q = parseFloat(purchase_qty) > 0 ? parseFloat(purchase_qty) : 1;
    const m = parseFloat(markup_percent) || 0;
    const unitCost = p / q;
    return parseFloat((unitCost * (1 + m / 100)).toFixed(2));
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, purchase_qty, markup_percent, selling_price, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (!error) {
      setProducts(data);
      setFiltered(data);
    }
  }, [storeId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Search filter
  useEffect(() => {
    if (!search) setFiltered(products);
    else {
      const q = search.toLowerCase();
      setFiltered(products.filter(p => p.name.toLowerCase().includes(q)));
    }
    setCurrentPage(1);
  }, [search, products]);

  // Handlers
  const handleAddChange = e => {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
  };

  const createProduct = async e => {
    e.preventDefault();
    const selling_price = calcSelling(addForm);
    await supabase.from('dynamic_product').insert([{ store_id: storeId, ...addForm, selling_price }]);
    setShowAdd(false);
    setAddForm({ name:'', description:'', purchase_price:'', purchase_qty:'', markup_percent:'' });
    fetchProducts();
  };

  const startEdit = p => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      purchase_qty: p.purchase_qty,
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
    let { purchase_price, purchase_qty, markup_percent, selling_price } = form;
    if (priceEditable) {
      // recalc markup_percent
      markup_percent = ((selling_price - purchase_price) / purchase_price) * 100;
    } else {
      // recalc selling_price
      selling_price = calcSelling({ purchase_price, purchase_qty, markup_percent });
    }
    await supabase.from('dynamic_product')
      .update({ name: form.name, description: form.description, purchase_price, purchase_qty, markup_percent, selling_price })
      .eq('id', editing.id);
    setEditing(null);
    fetchProducts();
  };

  const deleteProduct = async p => {
    if (window.confirm(`Delete product "${p.name}"?`)) {
      await supabase.from('dynamic_product').delete().eq('id', p.id);
      fetchProducts();
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Description,PurchasePrice,Qty,Markup%,SellingPrice,CreatedAt\n";
    filtered.forEach(p => {
      const row = [
        p.name,
        (p.description||'').replace(/,/g,' '),
        p.purchase_price.toFixed(2),
        p.purchase_qty,
        p.markup_percent.toFixed(2),
        p.selling_price.toFixed(2),
        p.created_at
      ].join(',');
      csv += row + '\n';
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'dynamic_products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Dynamic Products', 10, y); y += 10;
      filtered.forEach(p => {
        const line = `Name: ${p.name}, Purchase: ${p.purchase_price.toFixed(2)}, Qty: ${p.purchase_qty}, Markup: ${p.markup_percent.toFixed(2)}%, Sell: ${p.selling_price.toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('dynamic_products.pdf');
    });
  };

  return (
    <div className="p-4">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 ">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <FaPlus /> Add
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form onSubmit={createProduct} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md dark:text-white">
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            {[
              { name:'name', label:'Name' },
              { name:'description', label:'Description' },
              { name:'purchase_price', label:'Total Purchase Price' },
              { name:'purchase_qty', label:'Quantity Purchased' },
              { name:'markup_percent', label:'Markup %' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1">{field.label}</label>
                <input
                  type={field.name.includes('price')||field.name.includes('percent')||field.name.includes('qty')?'number':'text'}
                  step="0.01"
                  name={field.name}
                  value={addForm[field.name]}
                  onChange={handleAddChange}
                  required={['name','purchase_price','purchase_qty'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:bg-gray-900 dark:text-white"
                  
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
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow dark:bg-gray-900 dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr className="dark:bg-gray-900 dark:text-indigo-500">
              {['Name','Description','Purchase','Qty','Markup %','Selling','Created','Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.description}</td>
                <td className="px-4 py-2 text-sm">{p.purchase_price.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{p.purchase_qty}</td>
                <td className="px-4 py-2 text-sm">{p.markup_percent.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{p.selling_price.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-indigo-600 hover:text-indigo-800"><FaEdit/></button>
                  <button onClick={() => deleteProduct(p)} className="text-red-600 hover:text-red-800"><FaTrashAlt/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50">Prev</button>
        {[...Array(totalPages)].map((_,i)=> (
          <button key={i} onClick={()=>setCurrentPage(i+1)} className={`px-3 py-1 rounded ${currentPage===i+1?'bg-indigo-600 text-white':'bg-gray-200 hover:bg-gray-300'}`}>{i+1}</button>
        ))}
        <button onClick={() => setCurrentPage(prev => Math.min(prev+1, totalPages))} disabled={currentPage=== totalPages} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
      </div>

      {/* Exports */}
      <div className="flex justify-center gap-4 mt-6">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><FaFileCsv/>CSV</button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"><FaFilePdf/>PDF</button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit {editing.name}</h2>
            {[
              { name:'name', label:'Name' },
              { name:'description', label:'Description' },
              { name:'purchase_price', label:'Total Purchase Price'},
              { name:'purchase_qty', label:'Quantity Purchased' },
              { name:'markup_percent', label:'Markup %' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1">{field.label}</label>
                <input
                  type={field.name.includes('price')||field.name.includes('percent')||field.name.includes('qty')?'number':'text'}
                  step="0.01"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleFormChange}
                  required={['name','purchase_price','purchase_qty'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
            {/* Selling Price editable */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="number"
                name="selling_price"
                value={form.selling_price}
                onChange={handleFormChange}
                readOnly={!priceEditable}
                className={`flex-1 p-2 border rounded ${!priceEditable?'bg-gray-100':''}`}
              />
              <button onClick={() => setPriceEditable(v=>!v)} className="p-2 text-gray-600 hover:text-indigo-600"><FaEdit/></button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>{setEditing(null); setPriceEditable(false);}} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
