// InventoryManager.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInv, setFilteredInv] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Restock/edit state
  const [restockQty, setRestockQty] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);

  const REORDER_THRESHOLD = 5;

  // --- INITIAL LOAD ---
  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'), 10);
    if (!sid) return;
    setStoreId(sid);

    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', sid)
      .single()
      .then(({ data }) => data && setStoreName(data.shop_name));

    fetchProducts(sid);
  }, []);

  // --- SYNC PRODUCTS -> INVENTORY ON PRODUCTS LOAD ---
  useEffect(() => {
    if (!storeId || products.length === 0) return;
    const payload = products.map(({ id, purchase_qty }) => ({
      product_id: id,
      store_id: storeId,
      available_qty: purchase_qty
    }));
    supabase
      .from('inventory')
      .upsert(payload, { onConflict: ['product_id', 'store_id'] })
      .then(() => fetchInventory(storeId));
  }, [products, storeId]);

  // --- REALTIME SYNC FOR PRODUCTS UPDATES ---
  useEffect(() => {
    if (!storeId) return;
    const channel = supabase
      .channel(`inventory-sync-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
        async ({ new: updatedProd }) => {
          await supabase
            .from('inventory')
            .update({ available_qty: updatedProd.purchase_qty, updated_at: new Date() })
            .eq('product_id', updatedProd.id)
            .eq('store_id', storeId);
          fetchInventory(storeId);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [storeId]);

  // --- FETCHERS ---
  async function fetchProducts(sid) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, purchase_qty')
      .eq('store_id', sid)
      .order('name');
    if (!error) setProducts(data);
  }

  async function fetchInventory(sid) {
    const { data: invData, error: invErr } = await supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        available_qty,
        product:products(name)
      `)
      .eq('store_id', sid);
    if (invErr || !invData) return;

    // Sort client-side by product name
    invData.sort((a, b) => a.product.name.localeCompare(b.product.name));

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('product_id, quantity')
      .eq('store_id', sid);
    if (salesErr) return;

    const soldMap = salesData.reduce((acc, { product_id, quantity }) => {
      acc[product_id] = (acc[product_id] || 0) + quantity;
      return acc;
    }, {});

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

  // --- SEARCH & PAGINATION ---
  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const results = !searchTerm
      ? inventory
      : inventory.filter(i => i.product.name.toLowerCase().includes(q));
    setFilteredInv(results);
    setPage(0);
  }, [inventory, searchTerm]);

  // --- HANDLERS ---
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

  // --- RENDER ---
  if (!storeId) return <div className="p-4">Loading...</div>;

  const start = page * pageSize;
  const pageData = filteredInv.slice(start, start + pageSize);
  const totalPages = Math.ceil(filteredInv.length / pageSize);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center dark:text-white">
        Inventory Dashboard - {storeName}
      </h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by product…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <section className="overflow-x-auto dark:bg-gray-800 dark:text-white">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
              {['ID', 'Item', 'Avail.', 'Sold', 'Remains', 'Restock', 'Actions'].map((h, idx) => (
                <th key={idx} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(item => (
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
                <td className="px-4 py-2 text-center">{item.quantity_sold}</td>
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
                  <button
                    onClick={() => handleRestock(item.id)}
                    className="p-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    <RefreshCw size={14} />
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="inline-flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1 rounded bg-green-600 text-white"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 rounded bg-gray-300"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 rounded bg-yellow-400 text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded bg-red-500 text-white"
                        >
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
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-900 dark:text-white">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}