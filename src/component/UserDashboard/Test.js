import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrashAlt, FaPlus, FaBell } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtsManager() {
  const storeId = localStorage.getItem('store_id');
  const createdByUserId = localStorage.getItem('created_by_user_id');
  const [, setStore] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [debtEntries, setDebtEntries] = useState([
    {
      customer_id: '',
      customer_name: '',
      phone_number: '',
      dynamic_product_id: '',
      product_name: '',
      supplier: '',
      device_id: '',
      qty: '',
      owed: '',
      deposited: '',
      date: ''
    }
  ]);
  const [error, setError] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [reminderType, setReminderType] = useState('one-time');
  const [reminderTime, setReminderTime] = useState('');
  const debtsRef = useRef();

  // Fetch store details
  useEffect(() => {
    if (!storeId) {
      setError('Store ID is missing. Please select a store.');
      toast.error('Store ID is missing.');
      return;
    }
    const fetchStore = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('shop_name')
          .eq('id', storeId)
          .single();
        if (error) throw error;
        setStore(data);
      } catch (err) {
        setError('Failed to fetch store: ' + err.message);
        toast.error('Failed to fetch store.');
      }
    };
    fetchStore();
  }, [storeId]);

  // Fetch customers
  useEffect(() => {
    if (!storeId) return;
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customer')
          .select('id, fullname, phone_number')
          .eq('store_id', storeId);
        if (error) throw error;
        setCustomers(data || []);
      } catch (err) {
        setError('Failed to fetch customers: ' + err.message);
        toast.error('Failed to fetch customers.');
      }
    };
    fetchCustomers();
  }, [storeId]);

  // Fetch products
  useEffect(() => {
    if (!storeId) return;
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('dynamic_product')
          .select('id, name')
          .eq('store_id', storeId);
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        setError('Failed to fetch products: ' + err.message);
        toast.error('Failed to fetch products.');
      }
    };
    fetchProducts();
  }, [storeId]);

  // Fetch debts
  useEffect(() => {
    if (!storeId) return;
    const fetchDebts = async () => {
      try {
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('store_id', storeId);
        if (error) throw error;
        setDebts(data || []);
        setFilteredDebts(data || []);
      } catch (err) {
        setError('Failed to fetch debts: ' + err.message);
        toast.error('Failed to fetch debts.');
      }
    };
    fetchDebts();
  }, [storeId]);

  // Filter debts
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredDebts(
      debts.filter(d => {
        const fields = [
          d.customer_name,
          d.product_name,
          d.phone_number,
          d.supplier,
          d.device_id,
          String(d.qty),
          d.owed != null ? `₦${d.owed.toFixed(2)}` : '',
          d.deposited != null ? `₦${d.deposited.toFixed(2)}` : '',
          d.date
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
  }, [searchTerm, debts]);

  // Scroll debts into view
  useEffect(() => {
    if (debtsRef.current) {
      debtsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debts]);

  // Open reminder form
  const openReminderForm = debt => {
    setSelectedDebt(debt);
    setReminderType('one-time');
    setReminderTime('');
    setShowReminderForm(true);
  };

  // Save reminder
  const saveReminder = async () => {
    if (!selectedDebt || !reminderTime) {
      toast.error('Please select a debt and reminder time.');
      return;
    }

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    let nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const reminderData = {
      store_id: Number(storeId),
      debt_id: selectedDebt.id,
      customer_id: selectedDebt.customer_id,
      reminder_type: reminderType,
      reminder_time: reminderTime,
      next_reminder: nextReminder.toISOString(),
      is_active: true
    };

    try {
      const { error } = await supabase.from('debt_reminders').insert([reminderData]);
      if (error) throw error;
      toast.success(`Reminder set for ${selectedDebt.customer_name} at ${reminderTime}`);
      setShowReminderForm(false);
      setSelectedDebt(null);
      setReminderTime('');
    } catch (err) {
      console.error('Save Reminder Error:', err);
      toast.error('Failed to set reminder: ' + err.message);
    }
  };

  // Handle debt entry changes
  const handleDebtChange = (index, e) => {
    const { name, value } = e.target;
    const updatedEntries = [...debtEntries];
    updatedEntries[index] = { ...updatedEntries[index], [name]: value };

    if (name === 'customer_id' && value) {
      const selectedCustomer = customers.find(c => c.id === parseInt(value));
      if (selectedCustomer) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          customer_id: value,
          customer_name: selectedCustomer.fullname,
          phone_number: selectedCustomer.phone_number || ''
        };
      }
    }

    if (name === 'dynamic_product_id' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          dynamic_product_id: value,
          product_name: selectedProduct.name
        };
      }
    }

    setDebtEntries(updatedEntries);
  };

  // Add debt entry
  const addDebtEntry = () => {
    setDebtEntries([
      ...debtEntries,
      {
        customer_id: '',
        customer_name: '',
        phone_number: '',
        dynamic_product_id: '',
        product_name: '',
        supplier: '',
        device_id: '',
        qty: '',
        owed: '',
        deposited: '',
        date: ''
      }
    ]);
  };

  // Remove debt entry
  const removeDebtEntry = index => {
    if (debtEntries.length === 1) return;
    setDebtEntries(debtEntries.filter((_, i) => i !== index));
  };

  // Save debts
  const saveDebts = async () => {
    let hasError = false;
    const validEntries = debtEntries.filter(entry => {
      if (
        !entry.customer_id ||
        isNaN(parseInt(entry.customer_id)) ||
        !entry.dynamic_product_id ||
        isNaN(parseInt(entry.dynamic_product_id)) ||
        !entry.qty ||
        isNaN(parseInt(entry.qty)) ||
        !entry.owed ||
        isNaN(parseFloat(entry.owed)) ||
        !entry.date
      ) {
        hasError = true;
        return false;
      }
      return true;
    });

    if (hasError) {
      setError('Please fill all required fields (Customer, Product, Qty, Owed, Date).');
      toast.error('Please fill all required fields.');
      return;
    }

    const debtData = validEntries.map(entry => ({
      store_id: parseInt(storeId),
      customer_id: parseInt(entry.customer_id),
      dynamic_product_id: parseInt(entry.dynamic_product_id),
      customer_name: entry.customer_name,
      product_name: entry.product_name,
      phone_number: entry.phone_number || null,
      supplier: entry.supplier || null,
      device_id: entry.device_id || null,
      qty: parseInt(entry.qty),
      owed: parseFloat(entry.owed),
      deposited: entry.deposited ? parseFloat(entry.deposited) : 0.00,
      date: entry.date,
      created_by_user_id: createdByUserId ? parseInt(createdByUserId) : null,
      owner_id: createdByUserId ? parseInt(createdByUserId) : null
    }));

    try {
      await supabase.from('debts').insert(debtData);
      setEditing(null);
      setDebtEntries([
        {
          customer_id: '',
          customer_name: '',
          phone_number: '',
          dynamic_product_id: '',
          product_name: '',
          supplier: '',
          device_id: '',
          qty: '',
          owed: '',
          deposited: '',
          date: ''
        }
      ]);
      setError(null);
      toast.success(`${debtData.length} debt(s) saved!`);

      const { data, error } = await supabase.from('debts').select('*').eq('store_id', storeId);
      if (error) throw error;
      setDebts(data);
      setFilteredDebts(data);
    } catch (err) {
      console.error('Save Debts Error:', err);
      setError('Failed to save debts: ' + err.message);
      toast.error('Failed to save debts.');
    }
  };

  // Delete debt
  const deleteDebt = async id => {
    try {
      await supabase.from('debts').delete().eq('id', id);
      const { data, error } = await supabase.from('debts').select('*').eq('store_id', storeId);
      if (error) throw error;
      setDebts(data);
      setFilteredDebts(data);
      toast.success('Debt deleted!');
    } catch (err) {
      console.error('Delete Debt Error:', err);
      setError('Failed to delete debt: ' + err.message);
      toast.error('Failed to delete debt.');
    }
  };

  if (!storeId) {
    return <div className="p-4 text-center text-red-500">Store ID is missing. Please select a store.</div>;
  }

  return (
    <div className="p-4 space-y-6 dark:bg-gray-900 dark:text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Debts Management UI */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Debts</h2>

        {/* Search */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search debts..."
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-800 dark:text-white w-full"
          />
        </div>

        {/* Add Debt Button */}
        <div className="mb-4">
          <button
            onClick={() => setEditing({})}
            className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2 hover:bg-indigo-700"
          >
            <FaPlus /> Add Debt
          </button>
        </div>

        {/* Debts Table */}
        <div ref={debtsRef} className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-800 dark:text-indigo-400">
              <tr>
                <th className="text-left px-4 py-2 border-b">Customer</th>
                <th className="text-left px-4 py-2 border-b">Product</th>
                <th className="text-left px-4 py-2 border-b">Supplier</th>
                <th className="text-left px-4 py-2 border-b">Product ID</th>
                <th className="text-left px-4 py-2 border-b">Qty</th>
                <th className="text-left px-4 py-2 border-b">Owed</th>
                <th className="text-left px-4 py-2 border-b">Deposited</th>
                <th className="text-left px-4 py-2 border-b">Balance</th>
                <th className="text-left px-4 py-2 border-b">Date</th>
                <th className="text-left px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 border-b truncate">{d.customer_name}</td>
                  <td className="px-4 py-2 border-b truncate">{d.product_name}</td>
                  <td className="px-4 py-2 border-b truncate">{d.supplier || '-'}</td>
                  <td className="px-4 py-2 border-b truncate">{d.device_id || '-'}</td>
                  <td className="px-4 py-2 border-b">{d.qty}</td>
                  <td className="px-4 py-2 border-b">₦{(d.owed || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">₦{(d.deposited || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">₦{((d.owed - d.deposited) || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">{d.date}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex gap-3">
                      <button
                        onClick={() => deleteDebt(d.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                      >
                        <FaTrashAlt />
                      </button>
                      {(d.owed - d.deposited) > 0 && (
                        <button
                          onClick={() => openReminderForm(d)}
                          className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-600"
                          title="Set Reminder"
                        >
                          <FaBell />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center text-gray-500 py-4 dark:text-gray-400">
                    No debts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Debt Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-6 dark:bg-gray-800 dark:text-white">
            <h2 className="text-xl font-bold text-center">Add Debt</h2>

            {debtEntries.map((entry, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Debt Entry {index + 1}</h3>
                  {debtEntries.length > 1 && (
                    <button
                      onClick={() => removeDebtEntry(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="font-semibold block mb-1">Customer</span>
                    <select
                      name="customer_id"
                      value={entry.customer_id}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullname} ({c.phone_number || 'No Phone'})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Product</span>
                    <select
                      name="dynamic_product_id"
                      value={entry.dynamic_product_id}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Supplier</span>
                    <input
                      name="supplier"
                      value={entry.supplier}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Product ID</span>
                    <input
                      name="device_id"
                      value={entry.device_id}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Quantity</span>
                    <input
                      type="number"
                      name="qty"
                      value={entry.qty}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      required
                      min="1"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Owed</span>
                    <input
                      type="number"
                      name="owed"
                      value={entry.owed}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      required
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Deposited</span>
                    <input
                      type="number"
                      name="deposited"
                      value={entry.deposited}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Date</span>
                    <input
                      type="date"
                      name="date"
                      value={entry.date}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={addDebtEntry}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700"
            >
              <FaPlus /> Add Another Debt
            </button>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveDebts}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create Debt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {showReminderForm && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 dark:bg-gray-800 dark:text-white">
            <h2 className="text-xl font-bold text-center">Set Reminder for {selectedDebt.customer_name}</h2>
            <div className="space-y-4">
              <p><strong>Product:</strong> {selectedDebt.product_name}</p>
              <p><strong>Outstanding:</strong> ₦{((selectedDebt.owed - selectedDebt.deposited) || 0).toFixed(2)}</p>
              <label className="block">
                <span className="font-semibold block mb-1">Reminder Type</span>
                <select
                  value={reminderType}
                  onChange={e => setReminderType(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="one-time">One-Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="block">
                <span className="font-semibold block mb-1">Reminder Time</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReminderForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveReminder}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}