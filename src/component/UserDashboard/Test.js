import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../supabaseClient";
import { FaEdit, FaTrashAlt, FaPrint, FaDownload } from 'react-icons/fa';

export default function ReceiptManager() {
  const storeId = localStorage.getItem("store_id");
  const [store, setStore] = useState(null);
  const [saleGroupsList, setSaleGroupsList] = useState([]);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm,] = useState('');
  const [editing, setEditing] = useState(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [form, setForm] = useState({ customer_name: "", customer_address: "", phone_number: "", warranty: "" });

  // Dynamic style states
  const [headerBgColor, setHeaderBgColor] = useState('#1E3A8A');
  const [headerTextColor, setHeaderTextColor] = useState('#FFFFFF');
  const [headerFont, setHeaderFont] = useState('font-serif');
  const [bodyFont, setBodyFont] = useState('font-sans');
  const [watermarkColor, setWatermarkColor] = useState('rgba(30,58,138,0.1)');

  const printRef = useRef();
  const receiptsRef = useRef();

  // Fetch store details
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from("stores")
      .select("shop_name,business_address,phone_number")
      .eq("id", storeId)
      .single()
      .then(({ data }) => setStore(data));
  }, [storeId]);

  // Load sale groups with associated dynamic sales
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('sale_groups')
      .select(`
        id,
        store_id,
        total_amount,
        payment_method,
        created_at,
        dynamic_sales (
          id,
         
          quantity,
          amount,
          sale_group_id,
          dynamic_product (id, name, device_id)
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSaleGroupsList(data || []));
  }, [storeId]);

  // Load or initialize a single receipt for a sale group
  useEffect(() => {
    if (!selectedSaleGroup) {
      setReceipts([]);
      return;
    }
    (async () => {
      // Fetch existing receipts
      let { data: receiptData } = await supabase
        .from("receipts")
        .select("*")
        .eq("sale_group_id", selectedSaleGroup.id)
        .order('id', { ascending: false });

      // If no receipt exists, create one for the sale group
      if (receiptData.length === 0 && selectedSaleGroup.dynamic_sales?.length > 0) {
        const firstSale = selectedSaleGroup.dynamic_sales[0]; // Use first sale for representative fields
        const totalQuantity = selectedSaleGroup.dynamic_sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const receiptInsert = {
          store_receipt_id: selectedSaleGroup.store_id,
          sale_group_id: selectedSaleGroup.id,
          product_id: firstSale.dynamic_product.id, // Representative product_id
          sales_amount: selectedSaleGroup.total_amount,
          sales_qty: totalQuantity,
          product_name: firstSale.dynamic_product.name, // Representative product name
          device_id: firstSale.dynamic_product.device_id || null,
          customer_name: "",
          customer_address: "",
          phone_number: "",
          warranty: "",
          date: new Date(selectedSaleGroup.created_at).toISOString(),
          receipt_id: `RCPT-${selectedSaleGroup.id}-${Date.now()}`
        };

        const { data: newReceipt } = await supabase
          .from("receipts")
          .insert([receiptInsert])
          .select()
          .single();
        receiptData = [newReceipt];
      }

      // Ensure only one receipt is kept (delete extras if any)
      if (receiptData.length > 1) {
        const [latestReceipt] = receiptData; // Keep the latest
        await supabase
          .from("receipts")
          .delete()
          .eq("sale_group_id", selectedSaleGroup.id)
          .neq("id", latestReceipt.id);
        receiptData = [latestReceipt];
      }

      setReceipts(receiptData || []);
    })();
  }, [selectedSaleGroup]);

  // Filter receipts on searchTerm or receipts change
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const dateStr = selectedSaleGroup ? new Date(selectedSaleGroup.created_at).toLocaleDateString().toLowerCase() : '';
    setFilteredReceipts(
      receipts.filter(r => {
        const fields = [
          r.receipt_id,
          String(r.sale_group_id),
          r.product_name,
          String(r.sales_qty),
          r.device_id,
          r.sales_amount != null ? `₦${r.sales_amount.toFixed(2)}` : '',
          r.customer_name,
          r.customer_address,
          r.phone_number,
          r.warranty,
          dateStr
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
  }, [searchTerm, receipts, selectedSaleGroup]);

  // Scroll receipts into view whenever receipts list changes
  useEffect(() => {
    if (receiptsRef.current) {
      receiptsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [receipts]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openEdit = r => {
    setEditing(r);
    setForm({
      customer_name: r.customer_name || "",
      customer_address: r.customer_address || "",
      phone_number: r.phone_number || "",
      warranty: r.warranty || ""
    });
  };
  const saveReceipt = async () => {
    await supabase.from("receipts").update({ ...editing, ...form }).eq("id", editing.id);
    setEditing(null);
    setForm({ customer_name: "", customer_address: "", phone_number: "", warranty: "" });
    const { data } = await supabase
      .from("receipts")
      .select("*")
      .eq("sale_group_id", selectedSaleGroup.id)
      .order('id', { ascending: false });
    setReceipts(data);
  };
  const handlePrint = r => {
    openEdit(r);
    setTimeout(() => window.print(), 200);
  };

  if (!storeId) return <div className="p-4 text-center">Select a store first.</div>;

  const filteredSaleGroups = [...saleGroupsList]
    .filter(sg =>
      sg.id.toString().includes(salesSearch) ||
      sg.total_amount.toString().includes(salesSearch) ||
      sg.payment_method.toLowerCase().includes(salesSearch.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  // Print CSS
  const printStyles = `@media print { body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .printable-area { position: absolute; top:0; left:0; width:100%; } }`;
  const headerStyle = { backgroundColor: headerBgColor, color: headerTextColor };
  const watermarkStyle = { color: watermarkColor, fontSize: '4rem', opacity: 1 };

  return (
    <>
      <style>{printStyles}</style>

      <div className="print:hidden p-0 space-y-6">
        {/* Management UI */}
        <div className="p-0 dark:bg-gray-900 dark:text-white">
          <h2 className="text-lg font-semibold mb-4">Receipts</h2>

          {/* Search & Sort Controls */}
          <div className="w-full mb-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
              <input
                type="text"
                value={salesSearch}
                onChange={e => setSalesSearch(e.target.value)}
                placeholder="Search by Sale Group ID, Amount, or Payment Method"
                className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white w-full"
              />

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setSortKey('id');
                    setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="border px-4 py-2 rounded text-sm w-full sm:w-auto dark:bg-gray-800 dark:text-white"
                >
                  Sort by ID {sortKey === 'id' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                </button>

                <button
                  onClick={() => {
                    setSortKey('total_amount');
                    setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="border px-4 py-2 rounded text-sm w-full sm:w-auto dark:bg-gray-800 dark:text-white"
                >
                  Sort by Amount {sortKey === 'total_amount' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                </button>
              </div>
            </div>
          </div>

          {/* Sale Groups Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg text-sm dark:bg-gray-900 dark:text-white">
              <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Sale Group ID</th>
                  <th className="text-left px-4 py-2 border-b">Total Amount</th>
                  <th className="text-left px-4 py-2 border-b">Payment Method</th>
                  <th className="text-left px-4 py-2 border-b">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredSaleGroups.map(sg => (
                  <tr
                    key={sg.id}
                    onClick={() => setSelectedSaleGroup(sg)}
                    className={`cursor-pointer hover:bg-gray-100 dark:bg-gray-900 dark:text-white hover:bg-gray-100 ${
                      selectedSaleGroup?.id === sg.id ? 'bg-gray-200' : ''
                    }`}
                  >
                    <td className="px-4 py-2 border-b">#{sg.id}</td>
                    <td className="px-4 py-2 border-b">₦{sg.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-2 border-b">{sg.payment_method}</td>
                    <td className="px-4 py-2 border-b">{new Date(sg.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {filteredSaleGroups.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No sale groups found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipts Section */}
        <div ref={receiptsRef} className="space-y-4 p-0 dark:bg-gray-900 dark:text-white">
          <h3 className="text-xl font-semibold">
            Receipts {selectedSaleGroup ? `for Sale Group #${selectedSaleGroup.id}` : ''}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Receipt ID</th>
                  <th className="text-left px-4 py-2 border-b">Customer</th>
                  <th className="text-left px-4 py-2 border-b">Phone</th>
                  <th className="text-left px-4 py-2 border-b">Warranty</th>
                  <th className="text-left px-4 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                    <td className="px-4 py-2 border-b truncate">{r.receipt_id}</td>
                    <td className="px-4 py-2 border-b truncate">{r.customer_name || '-'}</td>
                    <td className="px-4 py-2 border-b truncate">{r.phone_number || '-'}</td>
                    <td className="px-4 py-2 border-b truncate">{r.warranty || '-'}</td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(r)} className="hover:text-indigo-600 dark:bg-gray-900 dark:text-white">
                          <FaEdit />
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.from("receipts").delete().eq("id", r.id);
                            const { data } = await supabase
                              .from("receipts")
                              .select("*")
                              .eq("sale_group_id", selectedSaleGroup.id);
                            setReceipts(data);
                          }}
                          className="hover:text-red-600 dark:bg-gray-900 dark:text-white"
                        >
                          <FaTrashAlt />
                        </button>
                        <button onClick={() => handlePrint(r)} className="hover:text-green-600">
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-4 dark:bg-gray-900 dark:text-white">
                      No receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="print:hidden fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-24">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">Edit Receipt {editing.receipt_id}</h2>

            {/* Receipt Fields */}
            <div className="space-y-4">
              {['customer_name', 'customer_address', 'phone_number', 'warranty'].map(field => (
                <label key={field} className="block w-full">
                  <span className="font-semibold capitalize block mb-1">
                    {field.replace('_', ' ')}
                  </span>
                  <input
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                  />
                </label>
              ))}
            </div>

            {/* Style Controls in Modal */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-semibold">Customize Receipt Style</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Header Background</label>
                  <input
                    type="color"
                    value={headerBgColor}
                    onChange={e => setHeaderBgColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 rounded dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Header Text Color</label>
                  <input
                    type="color"
                    value={headerTextColor}
                    onChange={e => setHeaderTextColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 rounded dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Header Font</label>
                  <select
                    value={headerFont}
                    onChange={e => setHeaderFont(e.target.value)}
                    className="border p-2 rounded w-full dark:bg-gray-900 dark:text-white"
                  >
                    <option value="font-sans">Sans</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Mono</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Body Font</label>
                  <select
                    value={bodyFont}
                    onChange={e => setBodyFont(e.target.value)}
                    className="border p-2 rounded w-full dark:bg-gray-900 dark:text-white"
                  >
                    <option value="font-sans">Sans</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Mono</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Watermark Color</label>
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={e => setWatermarkColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 rounded dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Preview Header */}
            <div className="mt-6 p-4 rounded" style={headerStyle}>
              <h3 className={`${headerFont} text-lg font-semibold`}>{store?.shop_name}</h3>
              <p className={`${headerFont} text-sm`}>{store?.business_address}</p>
              <p className={`${headerFont} text-sm`}>Phone: {store?.phone_number}</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={saveReceipt} className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-1">
                <FaDownload /> Save & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt */}
      {editing && selectedSaleGroup && (
        <div ref={printRef} className="printable-area relative bg-white p-6 mt-6 shadow-lg rounded overflow-x-auto">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={watermarkStyle}>
            <span className={`${bodyFont}`} style={{ opacity: 0.1 }}>{store?.shop_name}</span>
          </div>

          {/* Header */}
          <div className={`p-4 rounded-t ${headerFont}`} style={headerStyle}>
            <h1 className="text-2xl font-bold">{store?.shop_name}</h1>
            <p className="text-sm">{store?.business_address}</p>
            <p className="text-sm">Phone: {store?.phone_number}</p>
          </div>

          {/* Receipt Table */}
          <table className={`w-full table-fixed border-collapse mb-4 ${bodyFont}`}>
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Product</th>
                <th className="border px-2 py-1 text-left">Device ID</th>
                <th className="border px-2 py-1 text-left">Quantity</th>
                <th className="border px-2 py-1 text-left">Unit Price</th>
                <th className="border px-2 py-1 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedSaleGroup.dynamic_sales?.map(sale => (
                <tr key={sale.id}>
                  <td className="border px-2 py-1">{sale.dynamic_product.name}</td>
                  <td className="border px-2 py-1">{sale.dynamic_product.device_id || '-'}</td>
                  <td className="border px-2 py-1">{sale.quantity}</td>
                  <td className="border px-2 py-1">₦{(sale.amount / sale.quantity).toFixed(2)}</td>
                  <td className="border px-2 py-1">₦{sale.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="border px-2 py-1 text-right font-bold">Total:</td>
                <td className="border px-2 py-1 font-bold">₦{selectedSaleGroup.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Additional Details */}
          <div className="mt-4">
            <p><strong>Receipt ID:</strong> {editing.receipt_id}</p>
            <p><strong>Date:</strong> {new Date(selectedSaleGroup.created_at).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {selectedSaleGroup.payment_method}</p>
            <p><strong>Customer Name:</strong> {editing.customer_name || '-'}</p>
            <p><strong>Address:</strong> {editing.customer_address || '-'}</p>
            <p><strong>Phone:</strong> {editing.phone_number || '-'}</p>
            <p><strong>Warranty:</strong> {editing.warranty || '-'}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 p-4 mt-4">
            <div className="border-t text-center pt-2">Manager Signature</div>
            <div className="border-t text-center pt-2">Customer Signature</div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>
      )}
    </>
  );
}