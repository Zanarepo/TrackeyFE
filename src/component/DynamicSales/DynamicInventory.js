import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit2, Trash2, Save, X, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]); // State for action history
  const [historyIdCounter, setHistoryIdCounter] = useState(1); // Counter for int IDs
  const [showLowStock, setShowLowStock] = useState(false); // Toggle low stock table
  const [lowStockThreshold, setLowStockThreshold] = useState(5); // Low stock threshold
  const [lowStockSort, setLowStockSort] = useState('quantity'); // Sort by quantity or name

  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInv, setFilteredInv] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Restock/edit state
  const [restockQty, setRestockQty] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'));
    if (!sid) {
      toast.error('No store ID found in localStorage');
      return;
    }
    setStoreId(sid);

    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', sid)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(`Failed to fetch store: ${error.message}`);
        else setStoreName(data.shop_name);
      });

    fetchDynamicProducts(sid);
  }, []);

  // --- FETCH INVENTORY WHEN STORE ID SET ---
  useEffect(() => {
    if (storeId) fetchInventory(storeId);
  }, [storeId]);

  // --- SEED NEW PRODUCTS INTO INVENTORY ---
  useEffect(() => {
    if (!storeId || dynamicProducts.length === 0) return;

    const payload = dynamicProducts
      .filter(p => !inventory.some(i => i.dynamic_product?.id === p.id))
      .map(p => ({
        dynamic_product_id: p.id,
        store_id: storeId,
        available_qty: p.purchase_qty,
        quantity_sold: 0
      }));

    if (payload.length === 0) return;

    (async () => {
      const { error } = await supabase
        .from('dynamic_inventory')
        .insert(payload, {
          onConflict: ['dynamic_product_id', 'store_id'],
          ignoreDuplicates: true
        });
      if (error) {
        toast.error(`Seed error: ${error.message}`);
      } else {
        toast.success(`Seeded ${payload.length} new products to inventory`);
      }
      fetchInventory(storeId);
    })();
  }, [dynamicProducts, storeId, inventory]);

  // --- REAL-TIME SYNC: PRODUCT INSERT/UPDATE ---
  useEffect(() => {
    if (!storeId) return;
    const chan = supabase
      .channel(`inv-sync-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dynamic_product', filter: `store_id=eq.${storeId}` },
        async ({ new: p }) => {
          console.log('Real-time INSERT received:', p);
          const { error } = await supabase
            .from('dynamic_inventory')
            .upsert(
              {
                dynamic_product_id: p.id,
                store_id: storeId,
                available_qty: p.purchase_qty,
                quantity_sold: 0
              },
              {
                onConflict: ['dynamic_product_id', 'store_id']
              }
            );
          if (error) {
            toast.error(`Sync insert error: ${error.message}`);
          } else {
            toast.success(`Added ${p.name} to inventory`);
            setHistory(prev => [
              {
                id: historyIdCounter,
                action: 'insert',
                product_name: p.name,
                quantity: p.purchase_qty,
                timestamp: new Date().toISOString()
              },
              ...prev.slice(0, 9)
            ]);
            setHistoryIdCounter(prev => prev + 1);
          }
          fetchDynamicProducts(storeId);
          fetchInventory(storeId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dynamic_product', filter: `store_id=eq.${storeId}` },
        async ({ new: p }) => {
          console.log('Real-time UPDATE received:', p);
          // Only update if purchase_qty changed significantly
          const { data: existing } = await supabase
            .from('dynamic_inventory')
            .select('available_qty')
            .eq('dynamic_product_id', p.id)
            .eq('store_id', storeId)
            .single();
          if (existing && existing.available_qty !== p.purchase_qty) {
            const { error } = await supabase
              .from('dynamic_inventory')
              .update({ available_qty: p.purchase_qty, updated_at: new Date() })
              .eq('dynamic_product_id', p.id)
              .eq('store_id', storeId);
            if (error) {
              toast.error(`Sync update error: ${error.message}`);
            } else {
              toast.success(`Updated ${p.name} inventory`);
            }
          }
          fetchInventory(storeId);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(chan);
      console.log('Unsubscribed from channel:', `inv-sync-${storeId}`);
    };
  }, [storeId, historyIdCounter]);

  // --- FETCHERS ---
  async function fetchDynamicProducts(sid) {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, purchase_qty')
      .eq('store_id', sid)
      .order('name');
    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      setDynamicProducts([]);
    } else {
      setDynamicProducts(data || []);
    }
  }

  async function fetchInventory(storeId) {
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select(`
        id,
        available_qty,
        quantity_sold,
        dynamic_product (
          id,
          name
        )
      `)
      .eq('store_id', storeId);

    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
      return;
    }

    setInventory(data || []);
    console.log('Fetched inventory:', data);
  }

  // --- SEARCH & PAGINATION ---
  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const results = !q
      ? inventory
      : inventory.filter(i => {
          const name = i.dynamic_product?.name || '';
          return name.toLowerCase().includes(q);
        });

    setFilteredInv(results);
    setPage(0);
  }, [inventory, searchTerm]);

  // --- LOW STOCK ITEMS ---
  const lowStockItems = inventory
    .filter(item => item.available_qty <= lowStockThreshold)
    .sort((a, b) => {
      if (lowStockSort === 'quantity') {
        return a.available_qty - b.available_qty;
      }
      return (a.dynamic_product?.name || '').localeCompare(b.dynamic_product?.name || '');
    });

  // --- HANDLERS ---
  async function handleRestock(id) {
    const qty = parseInt(restockQty[id] || '0', 10);
    if (qty <= 0) {
      toast.error('Restock quantity must be positive', { position: 'top-right' });
      return;
    }
    const item = inventory.find(i => i.id === id);
    const newAvail = item.available_qty + qty;

    console.log(`Restocking item ${id}: Adding ${qty} to ${item.available_qty} -> ${newAvail}`);

    const { error } = await supabase
      .from('dynamic_inventory')
      .update({ available_qty: newAvail, updated_at: new Date() })
      .eq('id', id);
    if (error) {
      toast.error(`Restock error: ${error.message}`, { position: 'top-right' });
      console.error('Restock error:', error);
    } else {
      const productName = item.dynamic_product?.name || 'Unknown';
      toast.success(`Restocked ${qty} units of ${productName}`, { position: 'top-right' });
      setHistory(prev => [
        {
          id: historyIdCounter,
          action: 'restock',
          product_name: productName,
          quantity: qty,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9)
      ]);
      setHistoryIdCounter(prev => prev + 1);
      setRestockQty({ ...restockQty, [id]: '' });
      await fetchInventory(storeId); // Ensure immediate refresh
      console.log(`Restock completed for ${productName}: New quantity ${newAvail}`);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditQty(item.available_qty);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    const qty = parseInt(editQty, 10);
    if (qty < 0) {
      toast.error('Quantity cannot be negative', { position: 'top-right' });
      return;
    }
    const item = inventory.find(i => i.id === id);
    const oldQty = item.available_qty;
    const qtyChange = qty - oldQty;

    console.log(`Editing item ${id}: Changing from ${oldQty} to ${qty}`);

    const { error } = await supabase
      .from('dynamic_inventory')
      .update({ available_qty: qty, updated_at: new Date() })
      .eq('id', id);
    if (error) {
      toast.error(`Save error: ${error.message}`, { position: 'top-right' });
      console.error('Edit error:', error);
    } else {
      const productName = item.dynamic_product?.name || 'Unknown';
      toast.success(`Updated ${productName} to ${qty} units`, { position: 'top-right' });
      if (qtyChange !== 0) {
        setHistory(prev => [
          {
            id: historyIdCounter,
            action: 'edit',
            product_name: productName,
            quantity: qtyChange,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9)
        ]);
        setHistoryIdCounter(prev => prev + 1);
      }
      setEditingId(null);
      await fetchInventory(storeId);
      console.log(`Edit completed for ${productName}: New quantity ${qty}`);
    }
  }

  async function handleDelete(id) {
    const item = inventory.find(i => i.id === id);
    const productName = item.dynamic_product?.name || 'Unknown';

    console.log(`Deleting item ${id}: ${productName}`);

    const { error } = await supabase
      .from('dynamic_inventory')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(`Delete error: ${error.message}`, { position: 'top-right' });
      console.error('Delete error:', error);
    } else {
      toast.success(`Deleted ${productName} from inventory`, { position: 'top-right' });
      setHistory(prev => [
        {
          id: historyIdCounter,
          action: 'delete',
          product_name: productName,
          quantity: null,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 9)
      ]);
      setHistoryIdCounter(prev => prev + 1);
      await fetchInventory(storeId);
      console.log(`Delete completed for ${productName}`);
    }
  }

  if (!storeId) return <div className="p-4">Loading…</div>;

  const start = page * pageSize;
  const pageData = filteredInv.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredInv.length / pageSize));

  return (
    <div className="p-0 space-y-6">
      <h1 className="text-2xl font-bold text-center">{storeName} Inventory</h1>

    {/* Search and Low Stock Controls */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  {/* Search Input */}
  <input
    type="text"
    placeholder="Search by product…"
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    className="w-full sm:w-1/2 p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
  />

  {/* Controls Section */}
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    {/* Threshold Input */}
    <input
      type="number"
      min="0"
      value={lowStockThreshold}
      onChange={e => setLowStockThreshold(parseInt(e.target.value) || 5)}
      className="p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full sm:w-24"
      placeholder="Threshold"
    />

    {/* Sort Dropdown */}
    <select
      value={lowStockSort}
      onChange={e => setLowStockSort(e.target.value)}
      className="p-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full sm:w-auto"
    >
      <option value="quantity">Sort by Quantity</option>
      <option value="name">Sort by Name</option>
    </select>







    {/* Toggle Button */}
    <button
      onClick={() => setShowLowStock(!showLowStock)}
      disabled={lowStockItems.length === 0}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 w-full sm:w-auto
        ${lowStockItems.length === 0
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none'}
      `}
    >
      {showLowStock ? <EyeOff size={18} /> : <Eye size={18} />}
      {lowStockItems.length === 0
        ? 'No Low Stock'
        : `${showLowStock ? '' : ''} Low Stock (${lowStockItems.length})`}
    </button>
  </div>




</div>


      {/* Low Stock Table */}
      {showLowStock && lowStockItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Low Stock Items (Below {lowStockThreshold} Units)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
                <tr>
                  {['Product', 'Available Qty', 'Quantity Sold'].map((h, i) => (
                    <th key={i} className="p-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="p-2 whitespace-nowrap">{item.dynamic_product?.name || 'Unknown'}</td>
                    <td className="p-2 whitespace-nowrap text-red-500">{item.available_qty}</td>
                    <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="w-full overflow-x-auto dark:bg-gray-800 dark:text-white">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
            <tr>
              {['ID', 'Item', 'Avail.', 'Sold', 'Restock', 'Actions'].map((h, i) => (
                <th key={i} className="p-2 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="p-2 whitespace-nowrap">{item.id}</td>
                <td className="p-2 whitespace-nowrap">{item.dynamic_product?.name || 'Unknown'}</td>
                <td className="p-2 whitespace-nowrap">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={e => setEditQty(e.target.value)}
                      className="border p-1 rounded w-20 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      {item.available_qty}
                      {item.available_qty <= lowStockThreshold && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                  )}
                </td>
                <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={restockQty[item.id] || ''}
                      onChange={e => setRestockQty({ ...restockQty, [item.id]: e.target.value })}
                      className="border p-1 rounded w-16 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      placeholder="Qty"
                    />
                    <button
                      onClick={() => handleRestock(item.id)}
                      className="p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-600"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
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
      </div>

      {/* Pagination */}
      {filteredInv.length > 0 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Prev
          </button>
          <span className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Next
          </button>
        </div>
      )}

      {/* History Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Action History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
                <tr>
                  {['ID', 'Time', 'Action', 'Product', 'Quantity'].map((h, i) => (
                    <th key={i} className="p-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="p-2 whitespace-nowrap">{entry.id}</td>
                    <td className="p-2 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-nowrap capitalize">{entry.action}</td>
                    <td className="p-2 whitespace-nowrap">{entry.product_name}</td>
                    <td className="p-2 whitespace-nowrap">
                      {entry.quantity !== null ? entry.quantity : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}