import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";

export default function SalesSummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and sales data
  useEffect(() => {
    if (!ownerId) {
      setError('No owner_id found. Please log in again.');
      setLoading(false);
      return;
    }

    (async () => {
      // Fetch stores
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('owner_user_id', ownerId);

      if (storeErr) {
        setError(storeErr.message);
        setLoading(false);
        return;
      }
      setStores(storeData);

      if (storeData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch sales data
      const storeIds = storeData.map(store => store.id);
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const { data: salesData, error: salesErr } = await supabase
        .from('dynamic_sales')
        .select('store_id, amount, sold_at')
        .in('store_id', storeIds)
        .gte('sold_at', startDate)
        .lt('sold_at', nextDayStr);

      if (salesErr) {
        setError(salesErr.message);
        setLoading(false);
        return;
      }

      // Aggregate sales per store
      const summary = storeData.map(store => {
        const storeSales = salesData.filter(sale => sale.store_id === store.id);
        const totalSales = storeSales.reduce((sum, sale) => sum + sale.amount, 0);
        return { storeName: store.shop_name, totalSales };
      });
      setSalesSummary(summary);
      setLoading(false);
    })();
  }, [ownerId, startDate, endDate]);

  // Handlers for date changes
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  // Render component
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (stores.length === 0) return <p>No stores found for this owner.</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sales Summary</h1>
      
      {/* Date Range Selection */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="mt-1 p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="mt-1 p-2 border rounded"
          />
        </div>
      </div>

      {/* Sales Summary Table */}
      {salesSummary.length === 0 ? (
        <p>No sales data available for the selected period.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Store Name</th>
              <th className="p-2 border">Total Sales</th>
            </tr>
          </thead>
          <tbody>
            {salesSummary.map((summary, index) => (
              <tr key={index} className="even:bg-gray-50">
                <td className="p-2 border">{summary.storeName}</td>
                <td className="p-2 border">₦{summary.totalSales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}