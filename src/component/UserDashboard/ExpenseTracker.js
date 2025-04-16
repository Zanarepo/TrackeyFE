// ExpenseTracker.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export default function ExpenseTracker() {
  const storeId = Number(localStorage.getItem('store_id'));
  const userId  = Number(localStorage.getItem('user_id'));
  const isOwner = userId === storeId;

  const [showTable, setShowTable] = useState(false);
  const [expenses,  setExpenses]  = useState([]);
  const [types,     setTypes]     = useState([
    'Utility Bill',
    'Water',
    'Tax',
    'Transportation',
    'Fuel',
  ]);
  const [form, setForm] = useState({
    expense_date: '',
    expense_type: '',
    new_type: '',
    amount: '',
    description: '',
  });
  const [editingId,  setEditingId]  = useState(null);
  const [notification, setNotification] = useState('');

  // Fetch all expenses for this store
  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_tracker')
      .select('*')
      .eq('store_id', storeId)
      .order('expense_date', { ascending: false });
    if (error) {
      console.error(error);
      setNotification('Unable to load expenses.');
    } else {
      setExpenses(data);
      // also collect any types not in our default list
      const extra = Array.from(new Set(data.map(e => e.expense_type)))
        .filter(t => !types.includes(t));
      if (extra.length) setTypes(prev => [...prev, ...extra]);
    }
  }, [storeId, types]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Handle form inputs
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      expense_date: '',
      expense_type: '',
      new_type: '',
      amount: '',
      description: '',
    });
    setEditingId(null);
  };

  // Create or update an expense
  const handleSubmit = async e => {
    e.preventDefault();
    const type = form.expense_type === 'ADD_NEW' ? form.new_type : form.expense_type;
    if (!type) return setNotification('Please choose or add an expense type.');

    const payload = {
      store_id: storeId,
      expense_date: form.expense_date,
      expense_type: type,
      amount: Number(form.amount),
      description: form.description || null,
      created_by_user:  isOwner ? null : userId,
      created_by_owner: isOwner ? userId : null,
    };

    let res;
    if (editingId && isOwner) {
      res = await supabase
        .from('expense_tracker')
        .update(payload)
        .eq('id', editingId);
    } else {
      res = await supabase.from('expense_tracker').insert(payload);
    }

    if (res.error) {
      console.error(res.error);
      setNotification('Error saving expense.');
    } else {
      setNotification(editingId ? 'Expense updated!' : 'Expense created!');
      resetForm();
      fetchExpenses();
    }
  };

  // Owner-only delete
  const handleDelete = async id => {
    if (!isOwner) return;
    const { error } = await supabase
      .from('expense_tracker')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(error);
      setNotification('Error deleting expense.');
    } else {
      setNotification('Expense deleted.');
      fetchExpenses();
    }
  };

  // Populate form for editing
  const startEdit = exp => {
    setEditingId(exp.id);
    setForm({
      expense_date: exp.expense_date,
      expense_type: types.includes(exp.expense_type)
        ? exp.expense_type
        : 'ADD_NEW',
      new_type: types.includes(exp.expense_type)
        ? ''
        : exp.expense_type,
      amount: exp.amount,
      description: exp.description || '',
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {notification && (
        <div className="p-2 bg-green-100 text-green-800 rounded text-center">
          {notification}
        </div>
      )}

      <button
        onClick={() => setShowTable(v => !v)}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {showTable ? 'Hide Expenses' : 'Show Expenses'}
      </button>

      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-indigo-200">
                <th className="p-2">Date</th>
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Description</th>
                {isOwner && <th className="p-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} className="border-t">
                  <td className="p-2">{exp.expense_date}</td>
                  <td className="p-2">{exp.expense_type}</td>
                  <td className="p-2">{exp.amount.toFixed(2)}</td>
                  <td className="p-2">{exp.description}</td>
                  {isOwner && (
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => startEdit(exp)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">
          {editingId ? 'Edit Expense' : 'Add Expense'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div className="flex flex-col">
            <label>Date</label>
            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col">
            <label>Type</label>
            <select
              name="expense_type"
              value={form.expense_type}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            >
              <option value="" disabled>
                Select type…
              </option>
              {types.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="ADD_NEW">+ Add new…</option>
            </select>
          </div>

          {/* New Type Input */}
          {form.expense_type === 'ADD_NEW' && (
            <div className="flex flex-col">
              <label>New Type</label>
              <input
                type="text"
                name="new_type"
                value={form.new_type}
                onChange={handleChange}
                required
                className="p-2 border rounded"
                placeholder="Enter new expense type"
              />
            </div>
          )}

          {/* Amount */}
          <div className="flex flex-col">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              className="p-2 border rounded"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col sm:col-span-2">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="p-2 border rounded"
              placeholder="Optional notes…"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
          >
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="ml-0 sm:ml-2 mt-2 sm:mt-0 text-gray-600 underline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
