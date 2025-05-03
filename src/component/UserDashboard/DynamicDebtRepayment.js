import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtPaymentManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 10;

  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [showManager, setShowManager] = useState(false);
  //const [, setShowReminderForm] = useState(false);
  //const [reminderType,] = useState('one-time');
 // const [reminderTime,] = useState('');
  //const reminderIntervalRef = useRef(null);

  // Fetch debts
  const fetchDebts = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch the latest debt record for each customer_id and dynamic_product_id
    const { data, count, error } = await supabase
      .from('debts')
      .select(
        'id, customer_id, dynamic_product_id, customer_name, product_name, device_id, qty, owed, deposited, remaining_balance, paid_to, date, created_at',
        { count: 'exact' }
      )
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      toast.error('Failed to fetch debts.');
      return;
    }

    // Group debts by customer_id and dynamic_product_id, taking the latest record
    const latestDebts = [];
    const seen = new Set();
    for (const d of data) {
      const key = `${d.customer_id}-${d.dynamic_product_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const status = d.remaining_balance <= 0 ? 'paid' : d.deposited > 0 ? 'partial' : 'owing';
        latestDebts.push({
          ...d,
          status,
          last_payment_date: d.date // Latest payment date is the record's date
        });
      }
    }

    setDebts(latestDebts);
    setTotalCount(count || 0);
  }, [page, storeId]);

  useEffect(() => {
    if (storeId) {
      fetchDebts();
    } else {
      toast.error('Store ID is missing. Please log in or select a store.');
    }
  }, [fetchDebts, storeId]);

  // Filter debts based on search
  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = debts.filter(
      d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        (d.device_id || '').toLowerCase().includes(q) ||
        (d.paid_to || '').toLowerCase().includes(q)
    ).sort((a, b) => (a.remaining_balance > 0 && b.remaining_balance <= 0 ? -1 : 1));
    setFilteredDebts(filtered);
  }, [debts, search]);

  // Handle reminder notifications


  /**/

  const openModal = debt => {
    setSelectedDebt(debt);
    setPayAmount('');
    setPaidTo('');
    setShowModal(true);
  };

  const submitPayment = async e => {
    e.preventDefault();
    if (!selectedDebt) return;

    const payment = parseFloat(payAmount);
    if (isNaN(payment) || payment <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    if (payment > selectedDebt.remaining_balance) {
      toast.error(`Payment cannot exceed remaining balance of ₦${selectedDebt.remaining_balance.toFixed(2)}.`);
      return;
    }

    const newDeposited = selectedDebt.deposited + payment;
    const newRemainingBalance = selectedDebt.owed - newDeposited;

    const paymentData = {
      store_id: storeId,
      customer_id: selectedDebt.customer_id,
      dynamic_product_id: selectedDebt.dynamic_product_id,
      customer_name: selectedDebt.customer_name,
      product_name: selectedDebt.product_name,
      phone_number: selectedDebt.phone_number || null,
      supplier: selectedDebt.supplier || null,
      device_id: selectedDebt.device_id || null,
      qty: selectedDebt.qty,
      owed: selectedDebt.owed,
      deposited: newDeposited,
      remaining_balance: newRemainingBalance,
      paid_to: paidTo || null,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const { error } = await supabase.from('debts').insert([paymentData]);
      if (error) throw error;

      toast.success(`Payment of ₦${payment.toFixed(2)} recorded successfully${paidTo ? ` via ${paidTo}` : ''}!`);
      setShowModal(false);
      fetchDebts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-5xl mx-auto p-0 dark:bg-gray-900 dark:text-white">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Toggle Manager Button */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowManager(prev => !prev)}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          {showManager ? (
            <>
              <FaTimes className="mr-2" /> Close Record Payment
            </>
          ) : (
            <>
              <FaPlus className="mr-2" /> Re-payment
            </>
          )}
        </button>
      </div>

      {showManager && (
        <>
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-4 dark:text-indigo-300">Debt Payments</h1>

          {/* Search and Reminders */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full mb-4">
              <input
                type="text"
                placeholder="Search by customer, product, device ID, or payment type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </div>
            
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow mb-4">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-indigo-600">
                  <th className="px-4 py-3 text-left text-sm font-bold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Device ID</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Owed</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Paid</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Paid To</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Last Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map(d => (
                  <tr
                    key={d.id}
                    className={
                      d.status === 'paid'
                        ? 'bg-green-50 dark:bg-green-900'
                        : d.status === 'partial'
                        ? 'bg-yellow-50 dark:bg-yellow-900'
                        : 'bg-red-50 dark:bg-red-900'
                    }
                  >
                    <td className="px-4 py-3 text-sm truncate">{d.customer_name}</td>
                    <td className="px-4 py-3 text-sm truncate">{d.product_name}</td>
                    <td className="px-4 py-3 text-sm truncate">{d.device_id || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.owed || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.deposited || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.remaining_balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm truncate">{d.paid_to || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {d.last_payment_date ? new Date(d.last_payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                          <FaCheckCircle /> Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => openModal(d)}
                          className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                        >
                          <FaPlus className="mr-1" /> Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-gray-500 py-4 dark:text-gray-400">
                      No debts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showModal && selectedDebt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 z-50">
          <form
            onSubmit={submitPayment}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 dark:bg-gray-900 dark:text-white"
          >
            <h2 className="text-xl font-semibold">Pay for {selectedDebt.customer_name}</h2>
            <p>
              <span className="font-medium">Product:</span> {selectedDebt.product_name}
            </p>
            <p>
              <span className="font-medium">Device ID:</span> {selectedDebt.device_id || '-'}
            </p>
            <p>
              <span className="font-medium">Remaining Balance:</span> ₦{(selectedDebt.remaining_balance || 0).toFixed(2)}
            </p>
            <label className="block">
              <span className="font-medium">Payment Amount:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={selectedDebt.remaining_balance}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="font-medium">Payment To (e.g., Cash, UBA, etc):</span>
              <input
                type="text"
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                placeholder="Enter Name of the bank the money was sent to or cash"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/*   {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">Set Debt Reminders</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="font-semibold block mb-1">Reminder Type</span>
                <select
                  value={reminderType}
                  onChange={e => setReminderType(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
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
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                  required
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReminderForm(false)}
                className="px-4 py-2 bg-gray-200 rounded dark:bg-gray-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={scheduleReminders}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div> */}
    
      
    </div>
  );
}