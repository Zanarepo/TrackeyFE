import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit2, Trash2, Save, X, RefreshCw, PlusCircle, Search } from 'lucide-react';

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [newProductId, setNewProductId] = useState('');
  const [newInventoryQty, setNewInventoryQty] = useState(0);
  const [restockQty, setRestockQty] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const REORDER_THRESHOLD = 5;

  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'), 10);
    if (!sid) return;
    setStoreId(sid);
  
    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', sid)
      .single()
      .then(({ data }) => data && setStoreName(data.name));
  
    fetchProducts(sid);
    fetchInventory(sid);
  }, []);
  
  const handleSearch = useCallback(() => {
    const filtered = inventory.filter(item =>
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);
  
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);
  
  async function fetchProducts(sid) {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name')
      .eq('store_id', sid)
      .order('name');
    if (!error) setProducts(data);
  }
  
  async function fetchInventory(sid) {
    const { data: invData, error: invErr } = await supabase
      .from('dynamic_inventory')
      .select(`
        id,
        store_id,
        dynamic_product_id,
        available_qty,
        dynamic_product (name)
      `)
      .eq('store_id', sid)
      .order('id', { ascending: true });
  
    if (invErr || !invData) return;
  
    const { data: salesData, error: salesErr } = await supabase
      .from('dynamic_sales')
      .select('dynamic_product_id, quantity')
      .eq('store_id', sid);
  
    if (salesErr) return;
  
    const soldMap = salesData.reduce((acc, { dynamic_product_id, quantity }) => {
      acc[dynamic_product_id] = (acc[dynamic_product_id] || 0) + quantity;
      return acc;
    }, {});
  
    const combined = invData.map(item => {
      const sold = soldMap[item.dynamic_product_id] || 0;
      const remaining = item.available_qty - sold;
      return {
        ...item,
        product: item.dynamic_product,
        quantity: sold,
        remaining_qty: remaining < 0 ? 0 : remaining
      };
    });
  
    setInventory(combined);
  }
  
  const availableProducts = products.filter(p => 
    !inventory.some(item => item.dynamic_product_id === p.id)
  );



  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function handleRestock(id) {
    const qty = parseInt(restockQty[id] || 0, 10);
    if (qty <= 0) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newAvailable = item.available_qty + qty;

    await supabase
      .from('dynamic_inventory')
      .update({ available_qty: newAvailable, updated_at: new Date() })
      .eq('id', id);

    setRestockQty(prev => ({ ...prev, [id]: '' }));
    fetchInventory(storeId);
  }

  async function handleAddInventory() {
    const pid = parseInt(newProductId, 10);
    const qty = parseInt(newInventoryQty, 10);

    if (!pid || qty < 0) return;

    await supabase
      .from('dynamic_inventory')
      .insert([{ dynamic_product_id: pid, store_id: storeId, available_qty: qty }]);

    setNewProductId('');
    setNewInventoryQty(0);
    fetchInventory(storeId);
  }

  async function handleDelete(id) {
    await supabase.from('dynamic_inventory').delete().eq('id', id);
    fetchInventory(storeId);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditQty(item.available_qty);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    await supabase
      .from('dynamic_inventory')
      .update({ available_qty: editQty, updated_at: new Date() })
      .eq('id', id);
    setEditingId(null);
    fetchInventory(storeId);
  }

  if (!storeId) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold dark:bg-gray-900 dark:text-white">Inventory Dashboard {storeName}</h1>

      {/* Search and Add Inventory */}
      <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800 dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex items-center border rounded-lg p-2 dark:bg-gray-800">
            <Search className="text-gray-500 mr-2" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full outline-none bg-transparent"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <select
              className="flex-1 border rounded-lg p-2 dark:bg-gray-800 dark:text-white"
              value={newProductId}
              onChange={e => setNewProductId(e.target.value)}
            >
              <option value="">Choose product...</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              className="w-full sm:w-24 border rounded-lg p-2 dark:bg-gray-800 dark:text-white"
              placeholder="Qty"
              value={newInventoryQty}
              onChange={e => setNewInventoryQty(e.target.value)}
            />
            <button
              onClick={handleAddInventory}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <PlusCircle size={16} /> Add Stock
            </button>
          </div>
        </div>
      </section>

      {/* Inventory Table */}
      <section className="overflow-x-auto">
        <table className="min-w-full border-collapse table-auto bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:text-white">
          <thead>
          <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
              {['ID', 'Product', 'Available', 'Sold', 'Remaining', 'Restock', 'Actions'].map((h, idx) => (
                <th key={idx} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedInventory.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="px-4 py-2">{item.id}</td>
                <td className="px-4 py-2">{item.product?.name}</td>
                <td className="px-4 py-2">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={e => setEditQty(parseInt(e.target.value, 10))}
                      className="border p-1 rounded w-20"
                    />
                  ) : item.available_qty}
                </td>
                <td className="px-4 py-2 text-center">{item.quantity}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {item.remaining_qty}
                    {item.remaining_qty <= REORDER_THRESHOLD && (
                      <RefreshCw size={14} className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={restockQty[item.id] || ''}
                    onChange={e => setRestockQty({ ...restockQty, [item.id]: e.target.value })}
                    className="border p-1 rounded w-16 dark:bg-gray-800 dark:text-white"
                    placeholder="Qty"
                  />
                  <button onClick={() => handleRestock(item.id)} className="p-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white">
                    <RefreshCw size={14} />
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="inline-flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} className="p-1 rounded bg-green-600 text-white">
                          <Save size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-gray-300">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="p-1 rounded bg-yellow-400 text-white">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 rounded bg-red-500 text-white">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

       
      </section>
       {/* Pagination */}
       {filteredInventory.length > itemsPerPage && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: Math.ceil(filteredInventory.length / itemsPerPage) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
