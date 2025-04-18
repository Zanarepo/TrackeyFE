import React, { useEffect, useState, useCallback} from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import DebtHistory from './DebtHistory';

const DebtTracker = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    amount_owed: '',
  });

  const store_id = localStorage.getItem('store_id');
  const user_id = localStorage.getItem('user_id');
  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('customer')
      .select('id, fullname')
      .eq('store_id', store_id);
    if (error) toast.error('Failed to load customers');
    else setCustomers(data);
  }, [store_id]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('store_id', store_id);
    if (error) toast.error('Failed to load products');
    else setProducts(data);
  }, [store_id]);

  const fetchDebts = useCallback(async () => {
    const { data, error } = await supabase
      .from('debt_tracker')
      .select(`
        id,
        amount_owed,
        amount_deposited,
        amount_remaining,
        debt_date,
        customer:customer_id (fullname),
        product:product_id (name)
      `)
      .eq('store_id', store_id);
    if (error) toast.error('Failed to load debts');
    else setDebts(data);
  }, [store_id]);

  // ✅ Now safe to add as dependencies
  useEffect(() => {
    const fetchAll = async () => {
      await fetchCustomers();
      await fetchProducts();
      await fetchDebts();
    };
    fetchAll();
  }, [fetchCustomers, fetchProducts, fetchDebts]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let created_by_owner = null;
    let created_by_user = null;

    if (store_id) {
      created_by_owner = parseInt(store_id);
    } else if (user_id) {
      created_by_user = parseInt(user_id);
    }

    const insertData = {
      store_id: parseInt(store_id),
      customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
      product_id: formData.product_id ? parseInt(formData.product_id) : null,
      amount_owed: parseFloat(formData.amount_owed),
      amount_deposited: 0,
      created_by_owner,
      created_by_user,
    };

    const { error } = await supabase.from('debt_tracker').insert([insertData]);

    if (error) toast.error(error.message || 'Failed to insert debt');
    else {
      toast.success('Debt added');
      setFormData({ customer_id: '', product_id: '', amount_owed: '' });
      fetchDebts();
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Track Customer Debt</h2>

      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg"
      >
        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          required
          className="p-2 rounded border"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullname}
            </option>
          ))}
        </select>

        <select
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          className="p-2 rounded border"
        >
          <option value="">Select Product (optional)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="amount_owed"
          value={formData.amount_owed}
          onChange={handleChange}
          placeholder="Amount Owed"
          required
          className="p-2 rounded border"
        />

        <button
          type="submit"
          className="col-span-3 bg-indigo-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add Debt
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Existing Debts</h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Amount Owed</th>
                <th className="p-2 border">Deposited</th>
                <th className="p-2 border">Remaining</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td className="p-2 border">{d.customer?.fullname || '—'}</td>
                  <td className="p-2 border">{d.product?.name || '—'}</td>
                  <td className="p-2 border">₦{Number(d.amount_owed).toLocaleString()}</td>
                  <td className="p-2 border">₦{Number(d.amount_deposited).toLocaleString()}</td>
                  <td className="p-2 border font-semibold text-red-600">
                    ₦{Number(d.amount_remaining).toLocaleString()}
                  </td>
                  <td className="p-2 border">
                    {new Date(d.debt_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {debts.length === 0 && <p className="text-center py-4">No debts found.</p>} <br/> 
        </div>
        <DebtHistory />
      </div>
      
      
    </div>
  );
};

export default DebtTracker;
