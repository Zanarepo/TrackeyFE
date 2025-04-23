import React, { useState, useEffect, useCallback , useMemo} from 'react';
import {
  FaPlus,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaEdit,
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import DynamiclowStockAlert from './DynamiclowStockAlert';
//import DynamicInventory from '../DynamicSales/DynamicInventory';

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');

  // State
  const [products, setProducts]   = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');

  // Add‑sale modal
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({
    dynamic_product_id: '',
    quantity: '',
    unit_price: '',
    payment_method: '',
  });
  const [priceEditableAdd, setPriceEditableAdd] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;

const paginatedSales = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
}, [filtered, currentPage]);
const totalPages = Math.ceil(filtered.length / itemsPerPage);


  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price')
      .eq('store_id', storeId)
      .order('name');
    setProducts(data || []);
  }, [storeId]);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from('dynamic_inventory')
      .select('dynamic_product_id, available_qty')
      .eq('store_id', storeId);
    setInventory(data || []);
  }, [storeId]);

  // Fetch sales
  const fetchSales = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase
      .from('dynamic_sales')
      .select(`
        id,
        dynamic_product_id,
        quantity,
        unit_price,
        amount,
        payment_method,
        sold_at,
        dynamic_product(name)
      `)
      .eq('store_id', storeId)
      .order('sold_at', { ascending: false });
    setSales(data || []);
    setFiltered(data || []);
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchSales();
  }, [fetchProducts, fetchInventory, fetchSales]);

  // Search filter
  useEffect(() => {
    if (!search) return setFiltered(sales);
    const q = search.toLowerCase();
    setFiltered(sales.filter(s =>
      s.dynamic_product.name.toLowerCase().includes(q) ||
      s.payment_method.toLowerCase().includes(q)
    ));
  }, [search, sales]);

  // Handle form changes
  const handleAddChange = e => {
    const { name, value } = e.target;
    setAddForm(f => ({ ...f, [name]: value }));
    if (name === 'dynamic_product_id') {
      // set unit price
      const prod = products.find(p => p.id === +value);
      if (prod) {
        setAddForm(f => ({ ...f, unit_price: prod.selling_price }));
        setPriceEditableAdd(false);
      }
      // low stock alert
      const inv = inventory.find(i => i.dynamic_product_id === +value);
      if (inv && inv.available_qty < 6) {
        alert(`Low stock warning: only ${inv.available_qty} left in stock.`);
      }
    }
  };

  // Create sale
  const createSale = async e => {
    e.preventDefault();
    const { dynamic_product_id, quantity, unit_price, payment_method } = addForm;
    const amount = Number(quantity) * Number(unit_price);
    await supabase
      .from('dynamic_sales')
      .insert([{ store_id: storeId, dynamic_product_id, quantity, unit_price, amount, payment_method }]);
    setShowAdd(false);
    setAddForm({ dynamic_product_id: '', quantity: '', unit_price: '', payment_method: '' });
    fetchSales();
  };

  // Delete sale
  const deleteSale = async s => {
    if (!window.confirm(`Delete sale #${s.id}?`)) return;
    await supabase.from('dynamic_sales').delete().eq('id', s.id);
    fetchSales();
  };

  // Export CSV
  const exportCSV = () => {
    let csv = 'Product,Qty,Unit Price,Amount,Payment,Sold At\n';
    filtered.forEach(s => {
      csv += [
        s.dynamic_product.name,
        s.quantity,
        s.unit_price.toFixed(2),
        s.amount.toFixed(2),
        s.payment_method,
        new Date(s.sold_at).toLocaleString()
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'sales.csv'; link.click();
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Sales Report', 10, y); y += 10;
      filtered.forEach(s => {
        doc.text(
          `Product: ${s.dynamic_product.name}, Qty: ${s.quantity}, Unit: ${s.unit_price.toFixed(2)}, Amt: ${s.amount.toFixed(2)}, Pay: ${s.payment_method}`,
          10, y
        );
        y += 10;
      });
      doc.save('sales.pdf');
    });
  };

  return (
    <div className="p-0 ">
      <DynamiclowStockAlert />
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 w-full ">
  <input
    type="text"
    placeholder="Search sales..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="w-full p-2 border rounded border rounded dark:bg-gray-900 dark:text-white"
  />
  
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <button
      onClick={() => setShowAdd(true)}
      className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      <FaPlus /> Sale
    </button>
  </div>
</div>


      {/* Add‑Sale Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 ">
          <form
            onSubmit={createSale}
            className="bg-white p-6 rounded shadow w-full max-w-md dark:bg-gray-900 dark:text-white"
          >
            <h2 className="text-xl font-bold mb-4">Add Sale</h2>

            {/* Product */}
            <div className="mb-3 ">
              <label className="block mb-1 dark:bg-gray-900 dark:text-white">Product</label>
              <select
                name="dynamic_product_id"
                value={addForm.dynamic_product_id}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select a product…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="mb-3">
              <label className="block mb-1 ">Quantity</label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={addForm.quantity}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
                placeholder='Enter quantity...e.g: 1, 2, 3...'
              />
            </div>

            {/* Unit Price & edit button */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex-1">
                <label className="block mb-1">Unit Price</label>
                <input
                  type="number"
                  name="unit_price"
                  value={addForm.unit_price}
                  onChange={handleAddChange}
                  required
                  disabled={!priceEditableAdd}
                  className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
                  placeholder='Auto-filled from product...or edit to input manually'
                />
              </div>
              <button
                type="button"
                onClick={() => setPriceEditableAdd(v => !v)}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-900 dark:text-white"
              >
                <FaEdit />
              </button>
            </div>

            {/* Payment Method */}
            <div className="mb-3">
              <label className="block mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={addForm.payment_method}
                onChange={handleAddChange}
                required
                className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select method…</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Wallet</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded w-full sm:w-auto dark:bg-red-500 dark:text-white hover:bg-gray-300 dark:hover:bg-red-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded w-full sm:w-auto "
              >
                Save Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
          <thead className="bg-gray-100">
          <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
              {['Product','Quantity','Unit Price','Amount','Payment','Sold At','Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-indigo-700 dark:bg-gray-900 dark:text-indigo-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:text-white">
            {paginatedSales.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-sm">{s.dynamic_product.name}</td>
                <td className="px-4 py-2 text-sm">{s.quantity}</td>
                <td className="px-4 py-2 text-sm">{s.unit_price.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{s.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{s.payment_method}</td>
                <td className="px-4 py-2 text-sm">{new Date(s.sold_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">
                  <button
                    onClick={() => deleteSale(s)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
     
        </table>

  <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
  

</div> 



      </div>

      
      <div className="w-full flex justify-center items-center flex-wrap gap-2 mt-4">
  <button
    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
  >
    Prev
  </button>

  {[...Array(totalPages)].map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentPage(i + 1)}
      className={`px-3 py-1 rounded transition ${
        currentPage === i + 1
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      {i + 1}
    </button>
  ))}

  <button
    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
  >
    Next
  </button>
</div>

<div className="w-full flex flex-wrap justify-center items-center gap-3 mt-4">
  <button
    onClick={exportCSV}
    className="flex justify-center items-center gap-1 w-full sm:w-32 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
  >
    <FaFileCsv className="w-4 h-4" />
    <span className="text-base">CSV</span>
  </button>

  <button
    onClick={exportPDF}
    className="flex justify-center items-center gap-1 w-full sm:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
  >
    <FaFilePdf className="w-4 h-4" />
    <span className="text-base">PDF</span>
  </button>
</div>
  
  
      </div>

  );
}
