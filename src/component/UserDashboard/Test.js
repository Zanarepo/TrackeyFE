import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Dashboard({ session }) {
  const [salesPrefs, setSalesPrefs] = useState({
    email_address: '',
    frequency: 'daily',
  });
  const [inventoryPrefs, setInventoryPrefs] = useState({
    low_stock_email_address: '',
    low_stock_frequency: 'daily',
    low_stock_threshold: 5,
  });
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);

  // Get store_id from local storage
  useEffect(() => {
    const id = localStorage.getItem('store_id');
    if (id) {
      setStoreId(parseInt(id));
    } else {
      console.error('No store_id found in local storage');
      setLoading(false);
    }
  }, []);

  // Fetch store email and preferences
  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('email_address')
        .eq('id', storeId)
        .single();
      if (storeError) {
        console.error(storeError);
        setLoading(false);
        return;
      }

      const { data: salesPrefsData, error: salesPrefsError } = await supabase
        .from('store_preferences')
        .select('email_address, frequency')
        .eq('store_id', storeId)
        .single();
      if (salesPrefsError && salesPrefsError.code !== 'PGRST116') {
        console.error(salesPrefsError);
      }

      const { data: inventoryPrefsData, error: inventoryPrefsError } = await supabase
        .from('inventory_alert_preferences')
        .select('email_address, frequency, low_stock_threshold')
        .eq('store_id', storeId)
        .limit(1);
      if (inventoryPrefsError && inventoryPrefsError.code !== 'PGRST116') {
        console.error(inventoryPrefsError);
      }

      setSalesPrefs({
        email_address: salesPrefsData?.email_address || store.email_address || '',
        frequency: salesPrefsData?.frequency || 'daily',
      });
      setInventoryPrefs({
        low_stock_email_address: inventoryPrefsData?.[0]?.email_address || store.email_address || '',
        low_stock_frequency: inventoryPrefsData?.[0]?.frequency || 'daily',
        low_stock_threshold: inventoryPrefsData?.[0]?.low_stock_threshold || 5,
      });
      setLoading(false);
    };
    fetchData();
  }, [storeId]);

  const updateSalesPrefs = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('store_preferences').upsert({
      store_id: storeId,
      email_address: salesPrefs.email_address || null,
      frequency: salesPrefs.frequency,
      low_sales_threshold: 1000, // Ignored, but required by schema
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Sales preferences updated!');
    }
    setLoading(false);
  };

  const updateInventoryPrefs = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Fetch all dynamic_product_id from dynamic_inventory for the store
    const { data: inventory, error: inventoryError } = await supabase
      .from('dynamic_inventory')
      .select('dynamic_product_id')
      .eq('store_id', storeId);
    if (inventoryError) {
      alert(inventoryError.message);
      setLoading(false);
      return;
    }

    // Upsert inventory_alert_preferences for all products
    const preferences = inventory.map((item) => ({
      store_id: storeId,
      dynamic_product_id: item.dynamic_product_id,
      email_address: inventoryPrefs.low_stock_email_address || null,
      frequency: inventoryPrefs.low_stock_frequency,
      low_stock_threshold: parseInt(inventoryPrefs.low_stock_threshold),
    }));

    const { error: prefsError } = await supabase.from('inventory_alert_preferences').upsert(preferences, {
      onConflict: ['store_id', 'dynamic_product_id'],
    });
    if (prefsError) {
      alert(prefsError.message);
    } else {
      alert('Inventory alert preferences updated!');
    }
    setLoading(false);
  };

  if (!storeId) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-red-600 text-lg">No store ID found. Please log in again.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-8">
        {/* Sales Summary Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Summary Alerts</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set the email and frequency for receiving sales summary alerts.
          </p>
          <form onSubmit={updateSalesPrefs} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address (defaults to {salesPrefs.email_address})
              </label>
              <input
                type="email"
                value={salesPrefs.email_address}
                onChange={(e) => setSalesPrefs({ ...salesPrefs, email_address: e.target.value })}
                placeholder="Custom email (optional)"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={salesPrefs.frequency}
                onChange={(e) => setSalesPrefs({ ...salesPrefs, frequency: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} transition`}
            >
              {loading ? 'Updating...' : 'Save'}
            </button>
          </form>
        </div>

        {/* Inventory Alert Preferences */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Alert Preferences</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set the email, frequency, and low stock threshold for receiving low inventory alerts for all products.
          </p>
          <form onSubmit={updateInventoryPrefs} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address (defaults to {inventoryPrefs.low_stock_email_address})
              </label>
              <input
                type="email"
                value={inventoryPrefs.low_stock_email_address}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, low_stock_email_address: e.target.value })}
                placeholder="Custom email (optional)"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={inventoryPrefs.low_stock_frequency}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, low_stock_frequency: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Low Stock Threshold (units)</label>
              <input
                type="number"
                value={inventoryPrefs.low_stock_threshold}
                onChange={(e) => setInventoryPrefs({ ...inventoryPrefs, low_stock_threshold: e.target.value })}
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} transition`}
            >
              {loading ? 'Updating...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}