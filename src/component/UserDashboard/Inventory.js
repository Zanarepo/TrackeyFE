import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit2, Trash2, Save, X, RefreshCw, PlusCircle } from 'lucide-react';

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  // UI states for add/restock
  const [newProductId, setNewProductId] = useState('');
  const [newInventoryQty, setNewInventoryQty] = useState(0);
  const [restockQty, setRestockQty] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const REORDER_THRESHOLD = 5;

  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'), 10);
    if (!sid) return;
    setStoreId(sid);
    supabase
      .from('stores')
      .select('name')
      .eq('id', sid)
      .single()
      .then(({ data }) => data && setStoreName(data.name));

    fetchProducts(sid);
    fetchInventory(sid);
  }, []);

  async function fetchProducts(sid) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('store_id', sid)
      .order('name');
    if (!error) setProducts(data);
  }

  async function fetchInventory(sid) {
    // fetch inventory rows
    const { data: invData, error: invErr } = await supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        available_qty,
        product:products(name)
      `)
      .eq('store_id', sid)
      .order('id', { ascending: true });
    if (invErr || !invData) return;

    // fetch sales rows to compute sold quantities
    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('product_id, quantity')
      .eq('store_id', sid);
    if (salesErr) return;

    // aggregate sold quantities per product
    const soldMap = salesData.reduce((acc, { product_id, quantity }) => {
      acc[product_id] = (acc[product_id] || 0) + quantity;
      return acc;
    }, {});

    // combine into inventory items with computed sold and remaining
    const combined = invData.map(item => {
      const sold = soldMap[item.product_id] || 0;
      const remaining = item.available_qty - sold;
      return {
        ...item,
        quantity_sold: sold,
        remaining_qty: remaining < 0 ? 0 : remaining
      };
    });

    setInventory(combined);
  }

  async function handleRestock(id) {
    const qty = parseInt(restockQty[id] || 0, 10);
    if (qty <= 0) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newAvailable = item.available_qty + qty;
    await supabase
      .from('inventory')
      .update({ available_qty: newAvailable, updated_at: new Date() })
      .eq('id', id);
    setRestockQty({ ...restockQty, [id]: '' });
    fetchInventory(storeId);
  }

  async function handleAddInventory() {
    const pid = parseInt(newProductId, 10);
    const qty = parseInt(newInventoryQty, 10);
    if (!pid || qty < 0) return;
    await supabase
      .from('inventory')
      .insert([{ product_id: pid, store_id: storeId, available_qty: qty }]);
    setNewProductId('');
    setNewInventoryQty(0);
    fetchInventory(storeId);
  }

  async function handleDelete(id) {
    await supabase.from('inventory').delete().eq('id', id);
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
      .from('inventory')
      .update({ available_qty: editQty, updated_at: new Date() })
      .eq('id', id);
    setEditingId(null);
    fetchInventory(storeId);
  }

  if (!storeId) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold dark:bg-gray-800 dark:text-white">Inventory Dashboard  {storeName}</h1>

      {/* Add Inventory */}
      <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800 dark:text-white">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:bg-gray-800 dark:text-indigo-500 ">
          <PlusCircle size={20} /> Add New Stock
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            className="flex-1 border rounded-lg p-2 dark:bg-gray-800 dark:text-white"
            value={newProductId}
            onChange={e => setNewProductId(e.target.value)}
          >
            <option value="">Choose product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            className="flex items-center gap-2 bg-indigo-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg dark:bg-gray-800 dark:text-indigo-500"
          >
            <PlusCircle size={16} /> Add Stock
          </button>
        </div>
      </section>

      {/* Inventory Table */}
      <section className="overflow-x-auto">
        <table className="min-w-full border-collapse table-auto dark:bg-gray-800 dark:text-white">
          <thead>
            <tr className="bg-gray-100">
              {['ID', 'Product', 'Available', 'Sold', 'Remaining', 'Restock', 'Actions'].map((h, idx) => (
                <th key={idx} className="p-2 text-left dark:bg-gray-800 dark:text-indigo-500text-gray-700  dark:bg-gray-800 dark:text-indigo-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-100 dark:bg-gray-800 dark:text-white">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:bg-gray-800 dark:text-white ">{item.id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:bg-gray-800 dark:text-white">{item.product.name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:bg-gray-800 dark:text-white">
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
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-center dark:bg-gray-800 dark:text-white">{item.quantity_sold}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:bg-gray-800 dark:text-white dark:bg-gray-800 dark:text-white">
                  <div className="flex items-center justify-center gap-1 ">
                    {item.remaining_qty}
                    {item.remaining_qty <= REORDER_THRESHOLD && (
                      <RefreshCw size={14} className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 flex items-center gap-1 ">
                  <input
                    type="number"
                    min="0"
                    value={restockQty[item.id] || ''}
                    onChange={e => setRestockQty({...restockQty, [item.id]: e.target.value})}
                    className="border p-1 rounded w-16 dark:bg-gray-800 dark:text-white"
                    placeholder="Qty"
                  />
                  <button onClick={() => handleRestock(item.id)} className="p-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white ">
                    <RefreshCw size={14} />
                  </button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-center  dark:bg-grey-300 ">
                  <div className="inline-flex items-center justify-center gap-2 ">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} className="p-1 rounded bg-green-600 hover:bg-green-700 text-white ">
                          <Save size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-gray-300 hover:bg-gray-400">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white ">
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
    </div>
  );
}