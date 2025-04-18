import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const ExpenseManager = () => {
  const [form, setForm] = useState({
    expense_date: '',
    expense_type: '',
    amount: '',
    description: '',
  });
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const storeId = Number(localStorage.getItem('store_id'));
  const userId = localStorage.getItem('user_id'); // null if owner
  const isOwner = !userId; // if no userId, assume owner

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_tracker')
      .select('*')
      .eq('store_id', storeId)
      .order('expense_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch expenses');
    } else {
      setExpenses(data);
    }
  }, [storeId]);

  // 2️⃣ Now include fetchExpenses in the deps array
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      expense_date: '',
      expense_type: '',
      amount: '',
      description: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.expense_date || !form.expense_type || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      store_id: storeId,
      expense_date: form.expense_date,
      expense_type: form.expense_type,
      amount: Number(form.amount),
      description: form.description || null,
      created_by_user: isOwner ? null : Number(userId),
      created_by_owner: isOwner ? storeId : null,
    };

    let response;

    if (editingId) {
      response = await supabase
        .from('expense_tracker')
        .update(payload)
        .eq('id', editingId);
    } else {
      response = await supabase.from('expense_tracker').insert(payload);
    }

    const { error } = response;

    if (error) {
      toast.error('Error saving expense');
      return;
    }

    toast.success(`Expense ${editingId ? 'updated' : 'added'} successfully`);
    resetForm();
    setShowForm(false);
    fetchExpenses();
  };

  const handleEdit = (expense) => {
    setForm({
      expense_date: format(new Date(expense.expense_date), 'yyyy-MM-dd'),
      expense_type: expense.expense_type,
      amount: expense.amount,
      description: expense.description || '',
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isOwner) {
      toast.error('Only the store owner can delete expenses');
      return;
    }

    const { error } = await supabase
      .from('expense_tracker')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete expense');
      return;
    }

    toast.success('Expense deleted');
    fetchExpenses();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Expense Manager</h2>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Close Form' : 'Add Expense'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-4 space-y-4"
        >
          <div>
            <label className="block font-medium">Date</label>
            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Expense Type</label>
            <input
              type="text"
              name="expense_type"
              value={form.expense_type}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Type</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Description</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-t">
                <td className="p-2">{format(new Date(expense.expense_date), 'PPP')}</td>
                <td className="p-2">{expense.expense_type}</td>
                <td className="p-2">₦{expense.amount}</td>
                <td className="p-2">{expense.description}</td>
                <td className="p-2 space-x-2">
                  <button
                    className="text-blue-600"
                    onClick={() => handleEdit(expense)}
                  >
                    Edit
                  </button>
                  {isOwner && (
                    <button
                      className="text-red-600"
                      onClick={() => handleDelete(expense.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseManager;
