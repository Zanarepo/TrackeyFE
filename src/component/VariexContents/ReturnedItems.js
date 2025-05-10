import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../supabaseClient";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ReturnsByDeviceIdManager() {
  const storeId = localStorage.getItem("store_id");
  const [, setStore] = useState(null);
  const [deviceIdQuery, setDeviceIdQuery] = useState('');
  const [queriedReceipts, setQueriedReceipts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    receipt_id: "",
    customer_name: "",
    product_name: "",
    device_id: "",
    qty: "",
    amount: "",
    remark: "",
    status: "",
    returned_date: ""
  });
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const returnsRef = useRef();

  // Onboarding steps
  const onboardingSteps = [
    {
      target: '.device-id-query',
      content: 'Search for receipts by device ID to start a return.',
    },
    {
      target: '.add-return',
      content: 'Add a new return after finding a matching receipt.',
    },
    {
      target: '.search-returns',
      content: 'Search existing returns by customer, product, or status.',
    },
   
  ];

  // Check if onboarding has been completed
  useEffect(() => {
    if (!localStorage.getItem('returnsManagerOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000); // 3-second delay
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch store details
  useEffect(() => {
    if (!storeId) {
      setError("Store ID is missing. Please log in or select a store.");
      return;
    }
    supabase
      .from("stores")
      .select("shop_name,business_address,phone_number")
      .eq("id", storeId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch store details: " + error.message);
        } else {
          setStore(data);
        }
      });
  }, [storeId]);

  // Query receipts by device_id
  useEffect(() => {
    if (!deviceIdQuery || !storeId) {
      setQueriedReceipts([]);
      return;
    }
    supabase
      .from('receipts')
      .select('id, receipt_id, customer_name, product_name, device_id, sales_qty, sales_amount')
      .eq('store_receipt_id', storeId)
      .ilike('device_id', `%${deviceIdQuery}%`)
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch receipts: " + error.message);
        } else {
          setQueriedReceipts(data || []);
        }
      });
  }, [deviceIdQuery, storeId]);

  // Fetch returns for the current store
  useEffect(() => {
    if (!storeId) return;

    const fetchReturns = async () => {
      try {
        // Step 1: Fetch receipt IDs for the current store
        const { data: receipts, error: receiptError } = await supabase
          .from('receipts')
          .select('id')
          .eq('store_receipt_id', storeId);

        if (receiptError) {
          throw new Error("Failed to fetch receipts: " + receiptError.message);
        }

        const receiptIds = receipts.map(r => r.id);

        // Step 2: Fetch returns linked to those receipt IDs
        const { data: returnsData, error: returnsError } = await supabase
          .from('returns')
          .select('*')
          .in('receipt_id', receiptIds);

        if (returnsError) {
          throw new Error("Failed to fetch returns: " + returnsError.message);
        }

        setReturns(returnsData || []);
        setFilteredReturns(returnsData || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchReturns();
  }, [storeId]);

  // Filter returns on searchTerm
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredReturns(
      returns.filter(r => {
        const fields = [
          r.customer_name,
          r.product_name,
          r.device_id,
          String(r.qty),
          r.amount != null ? `₦${r.amount.toFixed(2)}` : '',
          r.remark,
          r.status,
          r.returned_date
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
  }, [searchTerm, returns]);

  // Scroll returns into view
  useEffect(() => {
    if (returnsRef.current) {
      returnsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [returns]);

  // Onboarding handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('returnsManagerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('returnsManagerOnboardingCompleted', 'true');
  };

  // Tooltip positioning
  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0 };
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX,
    };
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    // Auto-populate fields when receipt_id changes
    if (name === 'receipt_id' && value) {
      const selectedReceipt = queriedReceipts.find(r => r.id === parseInt(value));
      if (selectedReceipt) {
        setForm(f => ({
          ...f,
          receipt_id: value,
          customer_name: selectedReceipt.customer_name || "",
          product_name: selectedReceipt.product_name,
          device_id: selectedReceipt.device_id || "",
          qty: selectedReceipt.sales_qty || "",
          amount: selectedReceipt.sales_amount || ""
        }));
      }
    }
  };

  const openEdit = r => {
    setEditing(r);
    setForm({
      receipt_id: r.receipt_id.toString(),
      customer_name: r.customer_name || "",
      product_name: r.product_name,
      device_id: r.device_id || "",
      qty: r.qty || "",
      amount: r.amount || "",
      remark: r.remark || "",
      status: r.status || "",
      returned_date: r.returned_date || ""
    });
  };

  const saveReturn = async () => {
    // Validate receipt_id
    if (!form.receipt_id || isNaN(parseInt(form.receipt_id))) {
      setError("Please select a valid receipt.");
      return;
    }

    const returnData = {
      receipt_id: parseInt(form.receipt_id),
      customer_name: form.customer_name,
      product_name: form.product_name,
      device_id: form.device_id,
      qty: parseInt(form.qty),
      amount: parseFloat(form.amount),
      remark: form.remark,
      status: form.status,
      returned_date: form.returned_date
    };

    try {
      if (editing && editing.id) {
        await supabase.from("returns").update(returnData).eq("id", editing.id);
      } else {
        await supabase.from("returns").insert([returnData]);
      }

      setEditing(null);
      setForm({
        receipt_id: "",
        customer_name: "",
        product_name: "",
        device_id: "",
        qty: "",
        amount: "",
        remark: "",
        status: "",
        returned_date: ""
      });
      setError(null);

      // Refetch returns for the current store
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('id')
        .eq('store_receipt_id', storeId);

      if (receiptError) {
        throw new Error("Failed to fetch receipts: " + receiptError.message);
      }

      const receiptIds = receipts.map(r => r.id);

      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .in('receipt_id', receiptIds);

      if (returnsError) {
        throw new Error("Failed to fetch updated returns: " + returnsError.message);
      }

      setReturns(returnsData || []);
      setFilteredReturns(returnsData || []);
    } catch (err) {
      setError("Failed to save return: " + err.message);
    }
  };

  const deleteReturn = async id => {
    try {
      await supabase.from("returns").delete().eq("id", id);

      // Refetch returns for the current store
      const { data: receipts, error: receiptError } = await supabase
        .from('receipts')
        .select('id')
        .eq('store_receipt_id', storeId);

      if (receiptError) {
        throw new Error("Failed to fetch receipts: " + receiptError.message);
      }

      const receiptIds = receipts.map(r => r.id);

      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .in('receipt_id', receiptIds);

      if (returnsError) {
        throw new Error("Failed to fetch updated returns: " + returnsError.message);
      }

      setReturns(returnsData || []);
      setFilteredReturns(returnsData || []);
    } catch (err) {
      setError("Failed to delete return: " + err.message);
    }
  };

  if (!storeId) {
    return <div className="p-4 text-center text-red-500">Store ID is missing. Please log in or select a store.</div>;
  }

  return (
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white">
      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Returns Management UI */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Returns by Device ID</h2>

        {/* Device ID Query Input */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={deviceIdQuery}
            onChange={e => setDeviceIdQuery(e.target.value)}
            placeholder="Enter Device ID to search receipts"
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white device-id-query"
          />
        </div>

        {/* Queried Receipts */}
        {queriedReceipts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Matching Receipts</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
                  <tr>
                    <th className="text-left px-4 py-2 border-b">Receipt ID</th>
                    <th className="text-left px-4 py-2 border-b">Customer Name</th>
                    <th className="text-left px-4 py-2 border-b">Product</th>
                    <th className="text-left px-4 py-2 border-b">Device ID</th>
                    <th className="text-left px-4 py-2 border-b">Qty</th>
                    <th className="text-left px-4 py-2 border-b">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {queriedReceipts.map(r => (
                    <tr key={r.id} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                      <td className="px-4 py-2 border-b truncate">{r.receipt_id}</td>
                      <td className="px-4 py-2 border-b truncate">{r.customer_name || '-'}</td>
                      <td className="px-4 py-2 border-b truncate">{r.product_name}</td>
                      <td className="px-4 py-2 border-b truncate">{r.device_id || '-'}</td>
                      <td className="px-4 py-2 border-b">{r.sales_qty}</td>
                      <td className="px-4 py-2 border-b">₦{r.sales_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Return Button */}
        <div className="mb-4">
          <button
            onClick={() => setEditing({})}
            className={`px-4 py-2 rounded text-white add-return ${queriedReceipts.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'}`}
            disabled={queriedReceipts.length === 0}
          >
            Add Return
          </button>
        </div>

        {/* Search Returns */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search returns..."
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white search-returns"
          />
        </div>

        {/* Returns Table */}
        <div ref={returnsRef} className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
              <tr>
                <th className="text-left px-4 py-2 border-b">Customer Name</th>
                <th className="text-left px-4 py-2 border-b">Product</th>
                <th className="text-left px-4 py-2 border-b">Product ID</th>
                <th className="text-left px-4 py-2 border-b">Qty</th>
                <th className="text-left px-4 py-2 border-b">Amount</th>
                <th className="text-left px-4 py-2 border-b">Remark</th>
                <th className="text-left px-4 py-2 border-b">Status</th>
                <th className="text-left px-4 py-2 border-b">Returned Date</th>
                <th className="text-left px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((r, index) => (
                <tr key={r.id} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                  <td className="px-4 py-2 border-b truncate">{r.customer_name || '-'}</td>
                  <td className="px-4 py-2 border-b truncate">{r.product_name}</td>
                  <td className="px-4 py-2 border-b truncate">{r.device_id || '-'}</td>
                  <td className="px-4 py-2 border-b">{r.qty}</td>
                  <td className="px-4 py-2 border-b">₦{r.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border-b truncate">{r.remark || '-'}</td>
                  <td className="px-4 py-2 border-b">{r.status}</td>
                  <td className="px-4 py-2 border-b">{r.returned_date}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(r)} className={`hover:text-indigo-600 dark:bg-gray-900 dark:text-white edit-return-${index}`}>
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteReturn(r.id)}
                        className="hover:text-red-600 dark:bg-gray-900 dark:text-white"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-gray-500 py-4 dark:bg-gray-900 dark:text-white">
                    No returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-24">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">{editing.id ? 'Edit Return' : 'Add Return'}</h2>

            {/* Return Fields */}
            <div className="space-y-4">
              <label className="block w-full">
                <span className="font-semibold block mb-1">Receipt</span>
                <select
                  name="receipt_id"
                  value={form.receipt_id}
                  onChange={handleChange}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Receipt</option>
                  {queriedReceipts.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.receipt_id} - {r.product_name} ({r.customer_name || 'No Customer'})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Customer Name</span>
                <input
                  name="customer_name"
                  value={form.customer_name}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Product</span>
                <input
                  name="product_name"
                  value={form.product_name}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Device ID</span>
                <input
                  name="device_id"
                  value={form.device_id}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Quantity</span>
                <input
                  name="qty"
                  value={form.qty}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Amount</span>
                <input
                  name="amount"
                  value={form.amount}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              {['remark', 'status', 'returned_date'].map(field => (
                <label key={field} className="block w-full">
                  <span className="font-semibold capitalize block mb-1">
                    {field.replace('_', ' ')}
                  </span>
                  <input
                    type={field === 'returned_date' ? 'date' : 'text'}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                    required={field !== 'remark'}
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
              <button
                onClick={saveReturn}
                className={`px-4 py-2 rounded text-white ${form.receipt_id && !isNaN(parseInt(form.receipt_id)) ? 'bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!form.receipt_id || isNaN(parseInt(form.receipt_id))}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep < onboardingSteps.length && (
      <motion.div
  className="fixed z-[9999] bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 w-[90vw] max-w-sm sm:max-w-xs overflow-auto"
  style={{
    ...getTooltipPosition(onboardingSteps[onboardingStep].target),
    maxHeight: '90vh',
  }}
  variants={tooltipVariants}
  initial="hidden"
  animate="visible"
>
  <p className="text-sm text-white dark:text-gray-300 mb-2">
    {onboardingSteps[onboardingStep].content}
  </p>
  <div className="flex justify-between items-center flex-wrap gap-y-2">
    <span className="text-sm text-gray-200">
      Step {onboardingStep + 1} of {onboardingSteps.length}
    </span>
    
    <div className="space-x-2">
      <button
        onClick={handleSkipOnboarding}
        className="text-sm text-gray-300 hover:text-gray-800 dark:text-gray-300"
      >
        Skip
      </button>
      <button
        onClick={handleNextStep}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded"
      >
        {onboardingStep + 1 === onboardingSteps.length ? 'Finish' : 'Next'}
      </button>
    </div>
  </div>
</motion.div>

      )}
    </div>
  );
}