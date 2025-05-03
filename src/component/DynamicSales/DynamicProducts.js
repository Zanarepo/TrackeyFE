import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DynamicProducts() {
  const storeId = localStorage.getItem('store_id');

  // State
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState([{
    name: '',
    description: '',
    purchase_price: '',
    purchase_qty: '',
    selling_price: '',
    suppliers_name: '',
    device_id: '',
  }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const itemsPerPage = 5;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, purchase_qty, selling_price, suppliers_name, device_id, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error.message);
      toast.error('Failed to fetch products');
    } else {
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

  // Add product handlers
  const handleAddChange = (e, index) => {
    const { name, value } = e.target;
    setAddForm(prev => {
      const newForm = [...prev];
      newForm[index][name] = value;
      return newForm;
    });
  };

  const removeProduct = (index) => {
    setAddForm(prev => prev.filter((_, i) => i !== index));
  };

  const addAnotherProduct = () => {
    setAddForm(prev => [...prev, {
      name: '',
      description: '',
      purchase_price: '',
      purchase_qty: '',
      selling_price: '',
      suppliers_name: '',
      device_id: '',
    }]);
  };

  const createProducts = async (e) => {
    e.preventDefault();
    if (addForm.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    const isValid = addForm.every(product => 
      product.name && product.purchase_price && product.purchase_qty && product.selling_price
    );
    if (!isValid) {
      toast.error('Please fill all required fields for each product');
      return;
    }
    const productsToInsert = addForm.map(product => ({ store_id: storeId, ...product }));
    const { error } = await supabase.from('dynamic_product').insert(productsToInsert);
    if (error) {
      toast.error(`Failed to add products: ${error.message}`);
    } else {
      toast.success('Products added successfully');
      setShowAdd(false);
      setAddForm([{
        name: '',
        description: '',
        purchase_price: '',
        purchase_qty: '',
        selling_price: '',
        suppliers_name: '',
        device_id: '',
      }]);
      fetchProducts();
    }
  };

  // Edit handlers
  const startEdit = p => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      purchase_qty: p.purchase_qty,
      selling_price: p.selling_price,
      suppliers_name: p.suppliers_name,
      device_id: p.device_id,
    });
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const saveEdit = async () => {
    if (!form.name || !form.purchase_price || !form.purchase_qty || !form.selling_price) {
      toast.error('Please fill all required fields');
      return;
    }
    const { error } = await supabase
      .from('dynamic_product')
      .update({ 
        name: form.name,
        description: form.description,
        purchase_price: form.purchase_price,
        purchase_qty: form.purchase_qty,
        selling_price: form.selling_price,
        suppliers_name: form.suppliers_name,
        device_id: form.device_id
      })
      .eq('id', editing.id);
    if (error) {
      toast.error(`Failed to update product: ${error.message}`);
    } else {
      toast.success('Product updated successfully');
      setEditing(null);
      fetchProducts();
    }
  };

  const deleteProduct = async p => {
    if (window.confirm(`Delete product "${p.name}"?`)) {
      const { error } = await supabase.from('dynamic_product').delete().eq('id', p.id);
      if (error) {
        toast.error(`Failed to delete product: ${error.message}`);
      } else {
        toast.success('Product deleted successfully');
        fetchProducts();
      }
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Description,PurchasePrice,Qty,SellingPrice,Supplier,DeviceID,CreatedAt\n";
    filtered.forEach(p => {
      const row = [
        p.name,
        (p.description||'').replace(/,/g,' '),
        parseFloat(p.purchase_price).toFixed(2),
        p.purchase_qty,
        parseFloat(p.selling_price).toFixed(2),
        p.suppliers_name,
        p.device_id,
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
        const line = `Name: ${p.name}, Purchase: ${parseFloat(p.purchase_price).toFixed(2)}, Qty: ${p.purchase_qty}, Sell: ${parseFloat(p.selling_price).toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('dynamic_products.pdf');
    });
  };

  return (
    <div className="p-0">
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
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
          <FaPlus /> Products
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto pt-24">
          <div className="w-full max-w-3xl mx-auto">
            <form 
              onSubmit={createProducts} 
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full dark:text-white"
            >
              <h2 className="text-2xl font-bold mb-6">Add Products</h2>
              {addForm.map((product, index) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <h3 className="text-lg font-semibold mb-2">Product {index + 1}</h3>
                  {[
                    { name: 'name', label: 'Name' },
                    { name: 'description', label: 'Description' },
                    { name: 'purchase_price', label: 'Total Purchase Price' },
                    { name: 'purchase_qty', label: 'Quantity Purchased' },
                    { name: 'selling_price', label: 'Selling Price' },
                    { name: 'suppliers_name', label: 'Supplier Name' },
                    { name: 'device_id', label: 'Device ID' },
                  ].map(field => (
                    <div key={field.name} className="mb-2">
                      <label className="block mb-1">{field.label}</label>
                      <input
                        type={field.name.includes('price') || field.name.includes('qty') ? 'number' : 'text'}
                        step="0.01"
                        name={field.name}
                        value={product[field.name]}
                        onChange={(e) => handleAddChange(e, index)}
                        required={['name', 'purchase_price', 'purchase_qty', 'selling_price'].includes(field.name)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAnotherProduct}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Another Product
              </button>
              <div className="w-full flex justify-center gap-2 mt-6">
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
                  Add Products
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Name','Description','Purchase','Qty','Selling','Supplier','Device ID','Date','Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedProducts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.description}</td>
                <td className="px-4 py-2 text-sm">
                  {p.purchase_price != null 
                    ? parseFloat(p.purchase_price).toFixed(2) 
                    : ''}
                </td>
                <td className="px-4 py-2 text-sm">{p.purchase_qty}</td>
                <td className="px-4 py-2 text-sm">
                  {p.selling_price != null 
                    ? parseFloat(p.selling_price).toFixed(2) 
                    : ''}
                </td>
                <td className="px-4 py-2 text-sm">{p.suppliers_name}</td>
                <td className="px-4 py-2 text-sm">{p.device_id}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-indigo-600 hover:text-indigo-800">
                    <FaEdit/>
                  </button>
                  <button onClick={() => deleteProduct(p)} className="text-red-600 hover:text-red-800">
                    <FaTrashAlt/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          disabled={currentPage === 1} 
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentPage(i + 1)} 
            className={`px-3 py-1 rounded ${currentPage === i + 1 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {i + 1}
          </button>
        ))}
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          disabled={currentPage === totalPages} 
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Exports */}
      <div className="flex justify-center gap-4 mt-4">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><FaFileCsv/>CSV</button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"><FaFilePdf/>PDF</button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh] mt-32">
            <h2 className="text-xl font-bold mb-4">Edit {editing.name}</h2>
            {[
              { name: 'name', label: 'Name' },
              { name: 'description', label: 'Description' },
              { name: 'purchase_price', label: 'Total Purchase Price' },
              { name: 'purchase_qty', label: 'Quantity Purchased' },
              { name: 'selling_price', label: 'Selling Price' },
              { name: 'suppliers_name', label: 'Supplier Name' },
              { name: 'device_id', label: 'Device ID' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1">{field.label}</label>
                <input
                  type={field.name.includes('price') || field.name.includes('qty') ? 'number' : 'text'}
                  step="0.01"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleFormChange}
                  required={['name', 'purchase_price', 'purchase_qty', 'selling_price'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
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