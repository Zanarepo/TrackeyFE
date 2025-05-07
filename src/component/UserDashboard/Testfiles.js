import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InventorySummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [productFilter, setProductFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('available_qty');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showCharts, setShowCharts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and inventory data
  useEffect(() => {
    if (!ownerId) {
      setError('Please log in again.');
      toast.error('No owner ID found. Please log in.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('owner_user_id', ownerId);
      if (storeErr) {
        setError(storeErr.message);
        toast.error('Error fetching stores: ' + storeErr.message);
        setLoading(false);
        return;
      }
      setStores(storeData);

      if (storeData.length === 0) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('dynamic_inventory')
        .select(`
          store_id,
          available_qty,
          quantity_sold,
          dynamic_product (name)
        `)
        .in('store_id', storeData.map(store => store.id));

      if (selectedStore !== 'all') {
        query = query.eq('store_id', selectedStore);
      }

      const { data: inventoryData, error: inventoryErr } = await query;
      if (inventoryErr) {
        setError(inventoryErr.message);
        toast.error('Error fetching inventory: ' + inventoryErr.message);
        setLoading(false);
        return;
      }
      setInventoryRecords(inventoryData);
      setLoading(false);
    })();
  }, [ownerId, selectedStore]);

  // Filter and sort inventory records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = inventoryRecords;

    if (productFilter) {
      filtered = filtered.filter(record =>
        record.dynamic_product?.name.toLowerCase().includes(productFilter.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [inventoryRecords, productFilter, sortColumn, sortDirection]);

  // Pagination
  const paginatedInventory = filteredAndSortedRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredAndSortedRecords.length / itemsPerPage);

  // Chart data
  const chartData = stores.map(store => {
    const storeInventory = filteredAndSortedRecords.filter(record => record.store_id === store.id);
    const totalAvailable = storeInventory.reduce((sum, record) => sum + record.available_qty, 0);
    const totalSold = storeInventory.reduce((sum, record) => sum + record.quantity_sold, 0);
    return { name: store.shop_name, Available: totalAvailable, Sold: totalSold };
  });

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (stores.length === 0) return <div className="text-center p-6">No stores found. Add a store to start tracking inventory.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-6 dark:text-white">Inventory Summary</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Select Store</label>
          <select
            value={selectedStore}
            onChange={e => {
              setSelectedStore(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.shop_name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">Filter by Product</label>
          <input
            type="text"
            value={productFilter}
            onChange={e => {
              setProductFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter product name"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white p-0 rounded-md shadow-md mb-6 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Inventory Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Product Name</th>
                <th
                  className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300 cursor-pointer"
                  onClick={() => {
                    setSortColumn('available_qty');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Available Quantity {sortColumn === 'available_qty' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300 cursor-pointer"
                  onClick={() => {
                    setSortColumn('quantity_sold');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Quantity Sold {sortColumn === 'quantity_sold' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((record, index) => (
                <tr key={index}>
                  <td className="p-3 border-b dark:text-white">
                    {stores.find(s => s.id === record.store_id)?.shop_name || 'Unknown'}
                  </td>
                  <td className="p-3 border-b dark:text-white">
                    {record.dynamic_product?.name || 'Unknown'}
                  </td>
                  <td className="p-3 border-b dark:text-white">{record.available_qty}</td>
                  <td className="p-3 border-b dark:text-white">{record.quantity_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Chart Toggle */}
      <button
        onClick={() => setShowCharts(!showCharts)}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
      >
        {showCharts ? 'Hide Charts' : 'View Charts'}
      </button>

      {/* Charts */}
      {showCharts && (
        <div className="bg-white p-4 rounded-md shadow-md mb-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Inventory Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Available" fill="#8884d8" />
              <Bar dataKey="Sold" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}













/////////////////////////////////////////////////////////////Debts/////////////

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtorsSummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [debtRecords, setDebtRecords] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [owedFilter, setOwedFilter] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and debt data
  useEffect(() => {
    if (!ownerId) {
      setError('Please log in again.');
      toast.error('No owner ID found. Please log in.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      // Fetch stores
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('owner_user_id', ownerId);
      if (storeErr) {
        setError(storeErr.message);
        toast.error('Error fetching stores: ' + storeErr.message);
        setLoading(false);
        return;
      }
      setStores(storeData);

      if (storeData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch debt data
      let query = supabase
        .from('debts')
        .select(`
          store_id,
          customer_name,
          product_name,
          qty,
          owed,
          deposited,
          date,
          phone_number
        `)
        .in('store_id', storeData.map(store => store.id));

      if (selectedStore !== 'all') {
        query = query.eq('store_id', selectedStore);
      }

      const { data: debtData, error: debtErr } = await query;
      if (debtErr) {
        setError(debtErr.message);
        toast.error('Error fetching debts: ' + debtErr.message);
        setLoading(false);
        return;
      }
      setDebtRecords(debtData);
      setLoading(false);
    })();
  }, [ownerId, selectedStore]);

  // Filter debt records
  const filteredRecords = useMemo(() => {
    return debtRecords.filter(record => {
      const customerName = record.customer_name || '';
      const productName = record.product_name || '';
      const owed = record.owed - record.deposited;

      const matchesCustomer = customerFilter ? customerName.toLowerCase().includes(customerFilter.toLowerCase()) : true;
      const matchesProduct = productFilter ? productName.toLowerCase().includes(productFilter.toLowerCase()) : true;
      const matchesOwed = owedFilter ? owed >= Number(owedFilter) : true;

      return matchesCustomer && matchesProduct && matchesOwed;
    });
  }, [debtRecords, customerFilter, productFilter, owedFilter]);

  // Group debts by store
  const groupDebtsByStore = (records) => {
    const grouped = {};
    stores.forEach(store => {
      grouped[store.shop_name] = { 
        totalOwed: 0, 
        totalDeposited: 0
      };
    });

    records.forEach(record => {
      const store = stores.find(s => s.id === record.store_id);
      if (!store) return;
      const storeName = store.shop_name;

      grouped[storeName].totalOwed += record.owed;
      grouped[storeName].totalDeposited += record.deposited;
    });

    return grouped;
  };

  const debtsByStore = groupDebtsByStore(filteredRecords);
  const summaryData = Object.entries(debtsByStore).map(([storeName, data]) => ({
    storeName,
    totalOwed: data.totalOwed,
    totalDeposited: data.totalDeposited,
    outstanding: data.totalOwed - data.totalDeposited
  }));

  // Find store with highest outstanding debt
  const highestDebtStore = summaryData.reduce((highest, store) => {
    if (!highest || store.outstanding > highest.outstanding) return store;
    return highest;
  }, null);

  // Chart data for owed and deposited amounts
  const chartData = summaryData.map(s => ({
    name: s.storeName,
    Outstanding: s.outstanding,
    Deposited: s.totalDeposited
  }));

  // Pagination
  const paginatedDebts = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  if (loading) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (stores.length === 0) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">No stores found. Add a store to start tracking debts.</div>;

  return (
    <div className="p-0 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8 dark:text-indigo-300">Debtors Dashboard</h1>

      {/* Filters and Store Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Store</label>
          <select
            value={selectedStore}
            onChange={e => {
              setSelectedStore(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.shop_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Customer Name</label>
          <input
            type="text"
            value={customerFilter}
            onChange={e => {
              setCustomerFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by customer name"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Product Name</label>
          <input
            type="text"
            value={productFilter}
            onChange={e => {
              setProductFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by product name"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Min Outstanding (₦)</label>
          <input
            type="number"
            value={owedFilter}
            onChange={e => {
              setOwedFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Min outstanding amount"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-0 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Store Debt Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 dark:bg-indigo-900">
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Owed (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Deposited (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Outstanding (₦)</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((store, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">
                    {store.storeName}
                    {store.storeName === highestDebtStore?.storeName && (
                      <span className="ml-2 text-red-500 font-bold">★ Highest Debt</span>
                    )}
                  </td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{store.totalOwed.toFixed(2)}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{store.totalDeposited.toFixed(2)}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{store.outstanding.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {highestDebtStore && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Highest Debt Store: <span className="font-bold">{highestDebtStore.storeName}</span> with ₦{highestDebtStore.outstanding.toFixed(2)} outstanding.
          </p>
        )}
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          {showCharts ? 'Hide Charts' : 'View Charts'}
        </button>
        {showCharts && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Debt Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${value.toFixed(2)}`} />
                <Bar dataKey="Outstanding" fill="#ff6384" />
                <Bar dataKey="Deposited" fill="#36a2eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Debt Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Detailed Debt Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 dark:bg-indigo-900">
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Store</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Customer</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Phone</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Product</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Quantity</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Owed (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Deposited (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Outstanding (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDebts.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">
                    {stores.find(s => s.id === record.store_id)?.shop_name || 'Unknown'}
                  </td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.customer_name || 'Unknown'}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.phone_number || '-'}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.product_name || 'Unknown'}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.qty}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{record.owed.toFixed(2)}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{record.deposited.toFixed(2)}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">₦{(record.owed - record.deposited).toFixed(2)}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{new Date(record.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}

///////////////debts2;//////////////

import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtSummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [debtData, setDebtData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCharts, setShowCharts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and debt data
  useEffect(() => {
    if (!ownerId) {
      setError('Please log in again.');
      toast.error('No owner ID found. Please log in.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      // Fetch stores
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('owner_user_id', ownerId);
      if (storeErr) {
        setError(storeErr.message);
        toast.error('Error fetching stores: ' + storeErr.message);
        setLoading(false);
        return;
      }
      setStores(storeData);

      if (storeData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch debt data based on the new schema
      const storeIds = storeData.map(store => store.id);
      const { data: debtData, error: debtErr } = await supabase
        .from('debts')
        .select('store_id, customer_name, product_name, phone_number, qty, owed, deposited, date')
        .in('store_id', storeIds);
      if (debtErr) {
        setError(debtErr.message);
        toast.error('Error fetching debts: ' + debtErr.message);
        setLoading(false);
        return;
      }
      setDebtData(debtData);
      setLoading(false);
    })();
  }, [ownerId]);

  // Pagination
  const paginatedDebts = debtData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(debtData.length / itemsPerPage);

  // Calculate total debt per store for chart
  const totalDebtPerStore = stores.map(store => {
    const storeDebts = debtData.filter(debt => debt.store_id === store.id);
    const totalOwed = storeDebts.reduce((sum, debt) => sum + debt.owed, 0);
    return { name: store.shop_name, Owed: totalOwed };
  });

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (stores.length === 0) return <div className="text-center p-6">No stores found. Add a store to start tracking debts.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-6 dark:text-white">Debt Summary</h1>

      {/* Debt Table */}
      <div className="bg-white p-4 rounded-md shadow-md mb-6 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Debt Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Customer Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Phone Number</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Product Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Quantity</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Owed (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Deposited (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDebts.map((debt, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="p-3 border-b dark:text-white">{stores.find(s => s.id === debt.store_id)?.shop_name || 'Unknown'}</td>
                  <td className="p-3 border-b dark:text-white">{debt.customer_name}</td>
                  <td className="p-3 border-b dark:text-white">{debt.phone_number || 'N/A'}</td>
                  <td className="p-3 border-b dark:text-white">{debt.product_name}</td>
                  <td className="p-3 border-b dark:text-white">{debt.qty}</td>
                  <td className="p-3 border-b dark:text-white">₦{debt.owed.toFixed(2)}</td>
                  <td className="p-3 border-b dark:text-white">₦{debt.deposited.toFixed(2)}</td>
                  <td className="p-3 border-b dark:text-white">{new Date(debt.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Chart Toggle Button */}
      <button
        onClick={() => setShowCharts(!showCharts)}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        {showCharts ? 'Hide Charts' : 'View Charts'}
      </button>

      {/* Charts */}
      {showCharts && (
        <div className="bg-white p-4 rounded-md shadow-md mb-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Total Debt per Store</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={totalDebtPerStore}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value.toFixed(2)}`} />
              <Bar dataKey="Owed" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}