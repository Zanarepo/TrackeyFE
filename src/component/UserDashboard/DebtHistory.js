import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import './DebtPaymentTracker.css'; // for blurred rows styling

const DebtPaymentTracker = () => {
    const [debts, setDebts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState({ debt_tracker_id: '', amount_paid: '' });
  
    // Fetch debts and filter out fully paid ones
    const fetchDebts = useCallback(async () => {
      const store_id = localStorage.getItem('store_id'); // Retrieve store_id inside the callback
      const { data, error } = await supabase
        .from('debt_tracker')
        .select(`
          id,
          customer_id, 
          customer:customer_id (fullname),
          amount_owed,
          amount_deposited,
          amount_remaining
        `)
        .eq('store_id', store_id);
  
      if (error) toast.error('Failed to load debts');
      else {
        // Filter out customers with no remaining balance
        const filteredDebts = data.filter(debt => debt.amount_remaining > 0);
        setDebts(filteredDebts);
      }
    }, []); // No need for store_id here, since it's now inside the callback
  
    const fetchPayments = useCallback(async () => {
      const { data, error } = await supabase
        .from('debt_payment_history')
        .select(`
          id,
          amount_paid,
          payment_date,
          customer:customer_id (fullname)
        `)
        .order('payment_date', { ascending: false });
  
      if (error) toast.error('Failed to load payments');
      else setPayments(data);
    }, []); // No need for store_id here either
  
    useEffect(() => {
      fetchDebts();
      fetchPayments();
    }, [fetchDebts, fetchPayments]);
  
    const handleChange = (e) => {
      setForm((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { debt_tracker_id, amount_paid } = form;
        localStorage.setItem('selected_debt_id', debt_tracker_id);
      
        const store_id = localStorage.getItem('store_id'); // Retrieve store_id inside handleSubmit
      
        const { data: debtData, error: debtError } = await supabase
          .from('debt_tracker')
          .select('id, customer_id, amount_deposited, amount_owed')
          .eq('store_id', store_id)
          .eq('id', debt_tracker_id)
          .single();
      
        if (debtError || !debtData) {
          return toast.error('Failed to retrieve debt info');
        }
      
        const { customer_id, amount_deposited } = debtData;
        const newDeposited = parseFloat(amount_deposited || 0) + parseFloat(amount_paid);
      
        // Update the deposited amount, let the "amount_remaining" be calculated automatically
        const { error: insertError } = await supabase.from('debt_payment_history').insert([{
          debt_tracker_id: parseInt(debt_tracker_id),
          customer_id: customer_id,
          amount_paid: parseFloat(amount_paid),
        }]);
      
        if (insertError) return toast.error(insertError.message);
      
        const { error: updateError } = await supabase
          .from('debt_tracker')
          .update({
            amount_deposited: newDeposited, // Only update the deposited amount
          })
          .eq('id', debt_tracker_id);
      
        if (updateError) return toast.error(updateError.message);
      
        toast.success('Payment recorded');
        setForm({ debt_tracker_id: '', amount_paid: '' });
        fetchDebts(); // Refresh the debt list
        fetchPayments(); // Refresh the payments list
      };
      

  return (
    <div className="p-4 max-w-full">
      <h2 className="text-xl font-bold mb-4">Debt Repayment</h2>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col sm:flex-row gap-2 items-start sm:items-center"
      >
        <select
          name="debt_tracker_id"
          value={form.debt_tracker_id}
          onChange={handleChange}
          className="border p-2 w-full sm:w-auto rounded dark:bg-gray-800 dark:text-white"
          required
        >
          <option value="">Select Debt</option>
          {debts.map((debt) => (
            <option key={debt.id} value={debt.id}>
              {debt.customer?.fullname} — ₦{debt.amount_remaining} remaining
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.01"
          name="amount_paid"
          placeholder="Amount Paid"
          value={form.amount_paid}
          onChange={handleChange}
          className="border p-2 w-full sm:w-auto rounded dark:bg-gray-800 dark:text-white"
          required
        />

      <div className="w-full sm:w-auto max-w-full">
  <button
    type="submit"
    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-center text-sm sm:text-base"
  >
    Record Payment
  </button>
</div>

      </form>

      <h3 className="text-lg font-semibold mb-2 ">Debts Overview</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto border border-collapse ">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800 dark:text-indigo-500">
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-left">Owed</th>
              <th className="p-2 text-left">Deposited</th>
              <th className="p-2 text-left">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt) => (
              <tr
                key={debt.id}
                className={`border-t ${debt.amount_remaining <= 0 ? 'blurred' : ''}`}
              >
                <td className="p-2">{debt.customer?.fullname}</td>
                <td className="p-2">₦{debt.amount_owed}</td>
                <td className="p-2">₦{debt.amount_deposited}</td>
                <td className="p-2">₦{debt.amount_remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2 ">Payment History</h3>
<div className="overflow-x-auto">
  <table className="min-w-full text-sm table-auto border border-collapse">
    <thead>
      <tr className="bg-gray-100 dark:bg-gray-800 dark:text-indigo-500">
        <th className="p-2 text-left">Customer</th>
        <th className="p-2 text-left">Amount Paid</th>
        <th className="p-2 text-left">Payment Date</th>
      </tr>
    </thead>
    <tbody>
      {payments.map((payment) => (
        <tr key={payment.id} className="border-t">
          <td className="p-2">{payment.customer?.fullname || 'Unknown'}</td>
          <td className="p-2">₦{payment.amount_paid}</td>
          <td className="p-2">
            {payment.payment_date
              ? new Date(payment.payment_date).toLocaleString()
              : '—'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    </div>
  );
};

export default DebtPaymentTracker;
