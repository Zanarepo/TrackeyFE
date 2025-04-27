import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

export default function ReturnedItemsManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 5;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [returnedItems, setReturnedItems] = useState([]);

  const [newReturn, setNewReturn] = useState({
    customer_id: '',
    product_id: '',
    suppliers_name: '',
    device_id: '',
    //sale_amount: '',
    quantity: '',
    remark: '',
    status: 'no'
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // lookup fetchers
  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('customer')
      .select('id, fullname')
      .eq('store_id', storeId)
      .order('fullname');
    if (error) toast.error('Failed to load customers');
    else setCustomers(data);
  }, [storeId]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, suppliers_name, device_id')
      .eq('store_id', storeId)
      .order('name');
    if (error) toast.error('Failed to load products');
    else setProducts(data);
  }, [storeId]);

  const fetchReturnedItems = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await supabase
      .from('returned_items')
      .select(`
        id,
        customer_id,
        product_id,
        quantity,
        remark,
        status,
        returned_date,
        customer:customer_id(fullname),
        product:product_id(name,suppliers_name,device_id)
      `, { count: 'exact' })
      .eq('store_id', storeId)
      .range(from, to)
      .order('returned_date', { ascending: false });
    if (error) toast.error('Failed to load returned items');
    else {
      setReturnedItems(data || []);
      setTotalCount(count || 0);
    }
  }, [storeId, page]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, [fetchCustomers, fetchProducts]);

  useEffect(() => {
    fetchReturnedItems();
  }, [fetchReturnedItems]);

  // auto-populate supplier & device
  const handleProductChange = e => {
    const pid = e.target.value;
    const prod = products.find(p => p.id === Number(pid));
    setNewReturn(r => ({
      ...r,
      product_id: pid,
      suppliers_name: prod?.suppliers_name || '',
      device_id: prod?.device_id || ''
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNewReturn(r => ({ ...r, [name]: value }));
  };


  
  const handleAddOrUpdate = async e => {
    e.preventDefault();
    const { customer_id, product_id, remark, status } = newReturn;
    if (!customer_id || !product_id || !remark || !status) {
      toast.error('Please fill all required fields');
      return;
    }
    const payload = {
      store_id: storeId,
      customer_id: Number(customer_id),
      product_id: Number(product_id),
      remark,
      status,
      quantity: newReturn.quantity ? Number(newReturn.quantity) : null,
      created_by_owner: storeId
    };
  
    let error;
    if (editingId) {
      ({ error } = await supabase
        .from('returned_items')
        .update(payload)
        .eq('id', editingId)
      );
    } else {
      ({ error } = await supabase
        .from('returned_items')
        .insert([payload])
      );
    }
    if (error) toast.error(error.message);
    else {
      toast.success(editingId ? 'Return updated' : 'Return logged');
      setEditingId(null);
      setNewReturn({
        customer_id: '',
        product_id: '',
        suppliers_name: '',
        device_id: '',
        //sale_amount: '', // reset UI fields, even though not sent
        quantity: '',
        remark: '',
        status: 'no'
      });
      fetchReturnedItems();
      setShowForm(false);
    }
  };
  

  const handleDelete = async id => {
    if (!window.confirm('Delete this return?')) return;
    const { error } = await supabase.from('returned_items').delete().eq('id', id);
    if (error) toast.error(error.message);
    else fetchReturnedItems();
  };

  
  // filtering
  const filtered = returnedItems.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.product.name.toLowerCase().includes(q) ||
      r.product.suppliers_name.toLowerCase().includes(q) ||
      r.product.device_id.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <h2 className="text-3xl font-bold text-center text-indigo-700 dark:bg-gray-900 dark:text-white">Returned Items</h2>

      <div className="text-center">
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition "
        >
          {showForm ? 'Close Form' : (editingId ? 'Edit Return' : '+ New Return')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 bg-white p-4 rounded shadow">
          <select name="customer_id" value={newReturn.customer_id} onChange={handleChange} required className="p-2 border rounded">
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.fullname}</option>)}
          </select>

          <select name="product_id" value={newReturn.product_id} onChange={handleProductChange} required className="p-2 border rounded">
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <input type="text" readOnly value={newReturn.suppliers_name} placeholder="Supplier" className="p-2 border rounded bg-gray-100" />
          <input type="text" readOnly value={newReturn.device_id} placeholder="Device ID" className="p-2 border rounded bg-gray-100" />

          <input name="quantity" value={newReturn.quantity} onChange={handleChange} placeholder="Quantity (opt)" className="p-2 border rounded" type="number" />

          <input name="remark" value={newReturn.remark} onChange={handleChange} placeholder="Remark" required className="p-2 border rounded" />
          <select name="status" value={newReturn.status} onChange={handleChange} required className="p-2 border rounded">
            <option value="no">Not Returned</option>
            <option value="yes">Returned</option>
          </select>

          <button type="submit" className="col-span-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
            {editingId ? 'Update Return' : 'Create Return'}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search by product, supplier, or device..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded shadow dark:bg-gray-900 dark:text-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Customer</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Supplier</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Device ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Qty</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Remark</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Returned Date</th>
              <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:bg-gray-900 dark:text-white">
                <td className="px-4 py-2 text-sm">{r.customer.fullname}</td>
                <td className="px-4 py-2 text-sm">{r.product.name}</td>
                <td className="px-4 py-2 text-sm">{r.product.suppliers_name}</td>
                <td className="px-4 py-2 text-sm">{r.product.device_id}</td>
                {/*<td className="px-4 py-2 text-sm">{r.sale_amount || '-'}</td>*/}
                <td className="px-4 py-2 text-sm">{r.quantity || '-'}</td>
                <td className="px-4 py-2 text-sm">{r.remark}</td>
                <td className="px-4 py-2 text-sm">{r.status === 'yes' ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-sm">{new Date(r.returned_date).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-sm text-center space-x-2">
                  <button onClick={() => {
                    setEditingId(r.id);
                    setNewReturn({
                      customer_id: r.customer_id,
                      product_id: r.product_id,
                      suppliers_name: r.product.suppliers_name,
                      device_id: r.product.device_id,
                      
                 
                      remark: r.remark,
                      status: r.status
                    });
                    setShowForm(true);
                  }} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 dark:bg-gray-900 dark:text-white">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-900 dark:text-white ">Prev</button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded-full disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
