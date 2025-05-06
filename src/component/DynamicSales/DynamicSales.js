import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaPlus,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaEdit,
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import DynamiclowStockAlert from './DynamiclowStockAlert'
import 'react-toastify/dist/ReactToastify.css';

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');

  // State Declarations
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'daily', 'weekly'
  const itemsPerPage = 5;
  const [showAdd, setShowAdd] = useState(false);
  const [lines, setLines] = useState([
    { dynamic_product_id: '', quantity: 1, unit_price: '', device_id: '' },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [editing, setEditing] = useState(null);
  const [saleForm, setSaleForm] = useState({});

  // Computed Values
  const paginatedSales = useMemo(() => {
    if (viewMode !== 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, viewMode]);

  const dailyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = { period: date, total: 0, count: 0 };
      groups[date].total += s.amount;
      groups[date].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const weeklyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at);
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      const key = monday.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = { period: `Week of ${key}`, total: 0, count: 0 };
      groups[key].total += s.amount;
      groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const totalsData = useMemo(() => {
    if (viewMode === 'daily') return dailyTotals;
    if (viewMode === 'weekly') return weeklyTotals;
    return [];
  }, [viewMode, dailyTotals, weeklyTotals]);

  const paginatedTotals = useMemo(() => {
    if (viewMode === 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return totalsData.slice(start, start + itemsPerPage);
  }, [viewMode, totalsData, currentPage]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list') return Math.ceil(filtered.length / itemsPerPage);
    return Math.ceil(totalsData.length / itemsPerPage);
  }, [viewMode, filtered, totalsData]);

  const totalAmount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0), [lines]);

  // Data Fetching
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price')
      .eq('store_id', storeId)
      .order('name');
    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  }, [storeId]);

  const fetchInventory = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select('dynamic_product_id, available_qty')
      .eq('store_id', storeId);
    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
    } else {
      setInventory(data || []);
    }
  }, [storeId]);

  const fetchSales = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_sales')
      .select(`
        id,
        sale_group_id,
        dynamic_product_id,
        quantity,
        unit_price,
        amount,
        payment_method,
        paid_to,
        device_id,
        sold_at,
        dynamic_product(name)
      `)
      .eq('store_id', storeId)
      .order('sold_at', { ascending: false });
    if (error) {
      toast.error(`Failed to fetch sales: ${error.message}`);
      setSales([]);
      setFiltered([]);
    } else {
      setSales(data || []);
      setFiltered(data || []);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchSales();
  }, [fetchProducts, fetchInventory, fetchSales]);

  // Search Filter
  useEffect(() => {
    if (!search) return setFiltered(sales);
    const q = search.toLowerCase();
    setFiltered(
      sales.filter(
        (s) =>
          s.dynamic_product.name.toLowerCase().includes(q) ||
          s.payment_method.toLowerCase().includes(q) ||
          s.device_id?.toLowerCase().includes(q)
      )
    );
    setCurrentPage(1);
  }, [search, sales]);

  // Reset Pagination on View Mode Change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  // Form Handlers
  const handleLineChange = (idx, e) => {
    const { name, value } = e.target;
    setLines((ls) => {
      const next = [...ls];
      next[idx][name] = ['dynamic_product_id', 'quantity', 'unit_price'].includes(name) ? +value : value;
      if (name === 'dynamic_product_id') {
        const prod = products.find((p) => p.id === +value);
        if (prod) {
          next[idx].unit_price = prod.selling_price;
        }
        const inv = inventory.find((i) => i.dynamic_product_id === +value);
        if (inv && inv.available_qty < 6) {
          const prodName = prod?.name || 'this product';
          toast.warning(`Low stock: only ${inv.available_qty} left for ${prodName}`);
        }
      }
      return next;
    });
  };

  const addLine = () => setLines((ls) => [...ls, { dynamic_product_id: '', quantity: 1, unit_price: '', device_id: '' }]);
  const removeLine = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSaleForm((f) => ({
      ...f,
      [name]: ['quantity', 'unit_price'].includes(name) ? +value : value,
    }));
  };

  // CRUD Operations
  const createSale = async (e) => {
    e.preventDefault();
    try {
      if (!paymentMethod) {
        toast.error('Please select a payment method.');
        return;
      }
      for (const line of lines) {
        if (!line.dynamic_product_id || line.quantity <= 0 || line.unit_price <= 0) {
          toast.error('Please fill in all required fields for each sale line.');
          return;
        }
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (!inv || inv.available_qty < line.quantity) {
          const prod = products.find((p) => p.id === line.dynamic_product_id);
          toast.error(`Insufficient stock for ${prod.name}: only ${inv?.available_qty || 0} available`);
          return;
        }
      }

      const { data: grp, error: grpErr } = await supabase
        .from('sale_groups')
        .insert([{ store_id: storeId, total_amount: totalAmount, payment_method: paymentMethod }])
        .select('id')
        .single();
      if (grpErr) throw new Error(`Sale group creation failed: ${grpErr.message}`);
      const groupId = grp.id;

      const inserts = lines.map((l) => ({
        store_id: storeId,
        sale_group_id: groupId,
        dynamic_product_id: l.dynamic_product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        amount: l.quantity * l.unit_price,
        device_id: l.device_id || null,  // Allow device_id to be optional
        payment_method: paymentMethod,
      }));
      const { error: insErr } = await supabase.from('dynamic_sales').insert(inserts);
      if (insErr) throw new Error(`Sales insertion failed: ${insErr.message}`);

      for (const line of lines) {
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (inv) {
          const newQty = inv.available_qty - line.quantity;
          const { error } = await supabase
            .from('dynamic_inventory')
            .update({ available_qty: newQty })
            .eq('dynamic_product_id', line.dynamic_product_id)
            .eq('store_id', storeId);
          if (error) toast.error(`Inventory update failed for product ${line.dynamic_product_id}`);
          setInventory((prev) =>
            prev.map((i) =>
              i.dynamic_product_id === line.dynamic_product_id ? { ...i, available_qty: newQty } : i
            )
          );
        }
      }

      toast.success('Sale added successfully!');
      setShowAdd(false);
      setLines([{ dynamic_product_id: '', quantity: 1, unit_price: '', device_id: '' }]);
      setPaymentMethod('Cash');
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      const originalSale = sales.find((s) => s.id === editing);
      if (!originalSale) throw new Error('Sale not found');

      const quantityDiff = saleForm.quantity - originalSale.quantity;
      if (quantityDiff > 0) {
        const inv = inventory.find((i) => i.dynamic_product_id === originalSale.dynamic_product_id);
        if (!inv || inv.available_qty < quantityDiff) {
          throw new Error(
            `Insufficient stock to increase quantity by ${quantityDiff}. Available: ${inv?.available_qty || 0}`
          );
        }
      }

      const { error } = await supabase
        .from('dynamic_sales')
        .update({
          quantity: saleForm.quantity,
          unit_price: saleForm.unit_price,
          device_id: saleForm.device_id || null,  // Allow device_id to be optional
          payment_method: saleForm.payment_method || originalSale.payment_method,
        })
        .eq('id', editing);
      if (error) throw new Error(`Update failed: ${error.message}`);

      if (quantityDiff !== 0) {
        const inv = inventory.find((i) => i.dynamic_product_id === originalSale.dynamic_product_id);
        if (inv) {
          const newQty = inv.available_qty - quantityDiff;
          await supabase
            .from('dynamic_inventory')
            .update({ available_qty: newQty })
            .eq('dynamic_product_id', originalSale.dynamic_product_id)
            .eq('store_id', storeId);
          setInventory((prev) =>
            prev.map((i) =>
              i.dynamic_product_id === originalSale.dynamic_product_id ? { ...i, available_qty: newQty } : i
            )
          );
        }
      }

      toast.success('Sale updated successfully!');
      setEditing(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteSale = async (s) => {
    if (!window.confirm(`Delete sale #${s.id}?`)) return;
    try {
      const { error } = await supabase.from('dynamic_sales').delete().eq('id', s.id);
      if (error) throw new Error(`Deletion failed: ${error.message}`);

      const inv = inventory.find((i) => i.dynamic_product_id === s.dynamic_product_id);
      if (inv) {
        const newQty = inv.available_qty + s.quantity;
        await supabase
          .from('dynamic_inventory')
          .update({ available_qty: newQty })
          .eq('dynamic_product_id', s.dynamic_product_id)
          .eq('store_id', storeId);
        setInventory((prev) =>
          prev.map((i) =>
            i.dynamic_product_id === s.dynamic_product_id ? { ...i, available_qty: newQty } : i
          )
        );
      }

      toast.success('Sale deleted successfully!');
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Export Functions
  const exportCSV = () => {
    let csv;
    if (viewMode === 'list') {
      csv = 'Product, Qty,Unit Price,Amount,Payment, Product ID,Sold At\n';
      filtered.forEach((s) => {
        csv += [
          s.dynamic_product.name,
          s.device_id || '',
          s.quantity,
          s.unit_price.toFixed(2),
          s.amount.toFixed(2),
          s.payment_method,
          new Date(s.sold_at).toLocaleString(),
        ].join(',') + '\n';
      });
    } else {
      csv = 'Period,Total Sales,Number of Sales\n';
      totalsData.forEach((t) => {
        csv += [t.period, t.total.toFixed(2), t.count].join(',') + '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = viewMode === 'list' ? 'sales.csv' : `${viewMode}_totals.csv`;
    link.click();
    toast.success('CSV exported successfully!');
  };

  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text(viewMode === 'list' ? 'Sales Report' : `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Sales Totals`, 10, y);
      y += 10;
      if (viewMode === 'list') {
        filtered.forEach((s) => {
          doc.text(
            `Product: ${s.dynamic_product.name}, Device: ${s.device_id || ''}, Qty: ${s.quantity}, Unit: ${s.unit_price.toFixed(2)}, Amt: ${s.amount.toFixed(2)}, Pay: ${s.payment_method}, At: ${new Date(s.sold_at).toLocaleString()}`,
            10,
            y
          );
          y += 10;
        });
      } else {
        totalsData.forEach((t) => {
          doc.text(`Period: ${t.period}, Total: ${t.total.toFixed(2)}, Sales: ${t.count}`, 10, y);
          y += 10;
        });
      }
      doc.save(viewMode === 'list' ? 'sales.pdf' : `${viewMode}_totals.pdf`);
      toast.success('PDF exported successfully!');
    });
  };

  // Render
  return (
    <div className="p-0 max-w-7xl mx-auto">
      <DynamiclowStockAlert/>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="p-2 border rounded dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="list">Individual Sales</option>
              <option value="daily">Daily Totals</option>
              <option value="weekly">Weekly Totals</option>
            </select>
          </div>
          {viewMode === 'list' && (
            <input
              type="text"
              placeholder="Search sales by product, payment, or device…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded w-full sm:w-64 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full sm:w-auto"
        >
          <FaPlus /> New Sale
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={createSale}
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">Add Sale</h2>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                <div className="sm:col-span-4">
                  <label className="block mb-1 text-sm font-medium">Product</label>
                  <select
                    name="dynamic_product_id"
                    value={line.dynamic_product_id}
                    onChange={(e) => handleLineChange(idx, e)}
                    required
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, e)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_price"
                    value={line.unit_price}
                    onChange={(e) => handleLineChange(idx, e)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block mb-1 text-sm font-medium">Product ID (Optional)</label>
                  <input
                    type="text"
                    name="device_id"
                    value={line.device_id}
                    onChange={(e) => handleLineChange(idx, e)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                    disabled={lines.length === 1}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-green-600 hover:text-green-800 mb-4"
            >
              <FaPlus /> Add Item
            </button>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select payment method…</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Wallet</option>
              </select>
            </div>
            <div className="mb-4 text-lg font-semibold">Total: ₦{totalAmount.toFixed(2)}</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Edit Sale #{editing}</h2>
            {['quantity', 'unit_price', 'device_id', 'payment_method'].map((field) => (
              <div className="mb-4" key={field}>
                <label className="block mb-1 text-sm font-medium capitalize">{field.replace('_', ' ')}</label>
                {field === 'payment_method' ? (
                  <select
                    name={field}
                    value={saleForm[field] || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select payment method…</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Wallet</option>
                  </select>
                ) : (
                  <input
                    type={field === 'device_id' ? 'text' : 'number'}
                    step={field === 'unit_price' ? '0.01' : undefined}
                    name={field}
                    value={saleForm[field] || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required={field !== 'device_id'}  // Make Device ID optional
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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

      {/* Sales Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        {viewMode === 'list' ? (
          <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                {['Product', 'Quantity', 'Unit Price', 'Amount', 'Payment', 'Product ID', 'Sold At', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm">{s.dynamic_product.name}</td>
                  
                  <td className="px-4 py-2 text-sm">{s.quantity}</td>
                  <td className="px-4 py-2 text-sm">{s.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{s.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{s.payment_method}</td>
                  <td className="px-4 py-2 text-sm">{s.device_id || '-'}</td>
                  <td className="px-4 py-2 text-sm">{new Date(s.sold_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(s.id);
                        setSaleForm({
                          quantity: s.quantity,
                          unit_price: s.unit_price,
                          device_id: s.device_id || '',
                          payment_method: s.payment_method,
                        });
                      }}
                      className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      title="Edit sale"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteSale(s)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Delete sale"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Period</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total Sales (₦)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Number of Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTotals.map((t, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm">{t.period}</td>
                  <td className="px-4 py-2 text-sm">{t.total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500 transition"
        >
          Prev
        </button>
        {[...Array(totalPages).keys()].map((i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded transition ${
              currentPage === i + 1
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500 transition"
        >
          Next
        </button>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-1 w-full sm:w-32 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          title="Export to CSV"
        >
          <FaFileCsv className="w-4 h-4" />
          <span>CSV</span>
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center justify-center gap-1 w-full sm:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          title="Export to PDF"
        >
          <FaFilePdf className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}