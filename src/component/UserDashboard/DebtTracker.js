import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const DebtTracker = () => {
  const [debts, setDebts] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    product_name: '',
    description: '',
    amount_owed: '',
    amount_deposited: '',
    customer_id: '',
    customer_name: '',
    phone_number: '',
    status: 'pending',
  });

  const storeId = localStorage.getItem('store_id');
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchDebts = async () => {
      const { data, error } = await supabase
        .from('debt_tracker')
        .select('*')
        .eq('store_id', storeId)
        .order('debt_date', { ascending: false });

      if (error) console.error('Error fetching debts:', error.message);
      else setDebts(data);
    };

    fetchDebts();
  }, [storeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      store_id: parseInt(storeId),
      product_name: form.product_name,
      description: form.description,
      amount_owed: parseFloat(form.amount_owed),
      amount_deposited: parseFloat(form.amount_deposited),
      customer_id: form.customer_id ? parseInt(form.customer_id) : null,
      customer_name: form.customer_id ? null : form.customer_name,
      phone_number: form.phone_number,
      status: form.status,
    };

    if (userId) {
      payload.created_by_user = parseInt(userId);
    } else {
      payload.created_by_owner = parseInt(storeId);
    }

    let error;
    if (isEditing && editId) {
      const { error: updateError } = await supabase
        .from('debt_tracker')
        .update(payload)
        .eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('debt_tracker')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving debt:', error.message);
    } else {
      resetForm();
      const { data } = await supabase
        .from('debt_tracker')
        .select('*')
        .eq('store_id', storeId)
        .order('debt_date', { ascending: false });
      setDebts(data);
    }
  };

  const resetForm = () => {
    setFormOpen(false);
    setIsEditing(false);
    setEditId(null);
    setForm({
      product_name: '',
      description: '',
      amount_owed: '',
      amount_deposited: '',
      customer_id: '',
      customer_name: '',
      phone_number: '',
      status: 'pending',
    });
  };

  const handleDelete = async (id, debt) => {
    if (String(debt.created_by_owner) !== storeId) {
      alert('Only the store owner can delete this record.');
      return;
    }

    const { error } = await supabase.from('debt_tracker').delete().eq('id', id);
    if (error) {
      console.error('Error deleting debt:', error.message);
    } else {
      setDebts(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleEdit = (debt) => {
    const editable = (userId && debt.created_by_user === parseInt(userId)) ||
                     (!userId && String(debt.created_by_owner) === storeId);

    if (!editable) {
      alert('You are not allowed to edit this record.');
      return;
    }

    setFormOpen(true);
    setIsEditing(true);
    setEditId(debt.id);
    setForm({
      product_name: debt.product_name,
      description: debt.description,
      amount_owed: debt.amount_owed,
      amount_deposited: debt.amount_deposited,
      customer_id: debt.customer_id || '',
      customer_name: debt.customer_name || '',
      phone_number: debt.phone_number || '',
      status: debt.status,
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={() => {
          resetForm();
          setFormOpen(!formOpen);
        }}
        className="bg-indigo-600 text-white px-4 py-2 rounded mb-4 w-full sm:w-auto"
      >
        {formOpen ? 'Close Form' : 'Add New Debt'}
      </button>

      {formOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow w-full sm:w-2/3 mx-auto">
          <input
            type="text"
            name="product_name"
            value={form.product_name}
            onChange={handleChange}
            placeholder="Product/Service Name"
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="number"
            name="amount_owed"
            value={form.amount_owed}
            onChange={handleChange}
            placeholder="Amount Owed"
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="number"
            name="amount_deposited"
            value={form.amount_deposited}
            onChange={handleChange}
            placeholder="Amount Deposited"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="customer_id"
            value={form.customer_id}
            onChange={handleChange}
            placeholder="Customer ID (optional)"
            className="w-full border px-3 py-2 rounded"
          />
          {!form.customer_id && (
            <>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Customer Name"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full border px-3 py-2 rounded"
              />
            </>
          )}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            {isEditing ? 'Update Debt' : 'Save Debt'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white shadow rounded text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Owed</th>
              <th className="px-4 py-2">Deposited</th>
              <th className="px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((d) => {
              const canDelete = String(d.created_by_owner) === storeId;
              const canEdit =
                (userId && d.created_by_user === parseInt(userId)) ||
                (!userId && String(d.created_by_owner) === storeId);

              return (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.product_name}</td>
                  <td className="px-4 py-2">{d.customer_name || `Customer #${d.customer_id}`}</td>
                  <td className="px-4 py-2">₦{d.amount_owed}</td>
                  <td className="px-4 py-2">₦{d.amount_deposited}</td>
                  <td className="px-4 py-2">₦{d.amount_remaining}</td>
                  <td className="px-4 py-2">{d.status}</td>
                  <td className="px-4 py-2 space-x-2">
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(d)}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(d.id, d)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {debts.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No debts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebtTracker;
