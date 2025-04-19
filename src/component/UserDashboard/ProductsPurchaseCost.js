import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TIMEFRAMES = {
  daily: (date) => startOfDay(date),
  weekly: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  monthly: (date) => startOfMonth(date),
};

const CURRENCY_OPTIONS = [
  { code: 'NGN', symbol: '₦' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

export default function ProductCostsDashboard() {
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeframe, setTimeframe] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'NGN');
  const [showChart, setShowChart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch product costs
  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const start = TIMEFRAMES[timeframe](new Date()).toISOString();
    async function fetchCosts() {
      const { data, error } = await supabase
        .from('products')
        .select('name, purchase_price, created_at')
        .eq('store_id', storeId)
        .gte('created_at', start)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      else setProductData(data.map(p => ({
        name: p.name,
        price: parseFloat(p.purchase_price),
        date: p.created_at,
      })));  
    }
    fetchCosts();
  }, [timeframe]);

  // Filter, search, compute total
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = productData.filter(item =>
      item.name.toLowerCase().includes(lower)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [productData, searchQuery]);

  // Calculate grand total
  const grandTotal = useMemo(
    () => filteredData.reduce((sum, item) => sum + item.price, 0),
    [filteredData]
  );

  // Pagination
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === currency)?.symbol;

  // Exports
  const downloadCSV = () => {
    const header = ['Product', `Purchase Price (${currencySymbol})`, 'Date'];
    const rows = filteredData.map(d => [
      d.name,
      d.price.toFixed(2),
      format(new Date(d.date), 'yyyy-MM-dd'),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `product_costs_${timeframe}_${currency}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    doc.setFontSize(18);
    doc.text(`Product Costs (${timeframe.toUpperCase()})`, 40, 60);
    doc.setFontSize(12);
    let y = 100;
    ['Product', `Price (${currencySymbol})`, 'Date'].forEach((h, i) => {
      doc.text(h, 50 + i * 150, y);
    });
    y += 20;
    filteredData.forEach(r => {
      doc.text(r.name, 50, y);
      doc.text(r.price.toFixed(2), 200, y);
      doc.text(format(new Date(r.date), 'yyyy-MM-dd'), 350, y);
      y += 20;
      if (y > 700) { doc.addPage(); y = 60; }
    });
    doc.save(`product_costs_${timeframe}_${currency}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-18 bg-white shadow-lg rounded-lg  bg-gray-100 dark:bg-gray-900"> {/* changing backgrounf color update later */}
     
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-4">
        <div>
          <h2 className="text-2xl text-indigo-800 font-bold dark:bg-gray-900 dark:text-white">Product Purchase Costs</h2>
          <p className="text-sm text-gray-500 ">Overview of product purchase expenses.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg font-semibold shadow-sm dark:bg-gray-800 dark:text-indigo-300">
          Total Cost: {currencySymbol}{grandTotal.toFixed(2)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap mb-4 ">
        {Object.keys(TIMEFRAMES).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none ${
              tf === timeframe
                ? 'bg-indigo-600 text-white dark:bg-gray-800 dark:text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-gray-800 dark:text-white'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search product..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-indigo-300 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={currency}
          onChange={e => {
            setCurrency(e.target.value);
            localStorage.setItem('currency', e.target.value);
          }}
          className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white "
        >
          {CURRENCY_OPTIONS.map(c => (
            <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg ">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-200 dark:bg-gray-800 dark:text-white">
            <tr className="text-gray-500 font-bold dark:bg-gray-800 dark:text-indigo-500">
              <th className="px-6 py-3 text-left text-xs uppercase ">Product</th>
              <th className="px-6 py-3 text-right text-xs uppercase">Price</th>
              <th className="px-6 py-3 text-right text-xs uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:text-white">
            {paginated.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 ">
                <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium dark:bg-gray-800 dark:text-white">{row.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:bg-gray-800 dark:text-white">{currencySymbol}{row.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:bg-gray-800 dark:text-white">{format(new Date(row.date), 'yyyy-MM-dd')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-gray-800 dark:text-white">
            <tr>
              <td colSpan={2} className="px-6 py-3 text-right font-bold">Page {currentPage} of {pageCount}</td>
              <td className="px-6 py-3 text-right space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                >Prev</button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                >Next</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-6">
        <button onClick={downloadCSV} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">CSV</button>
        <button onClick={downloadPDF} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">PDF</button>
        <button onClick={() => setShowChart(true)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Chart</button>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 mt-16">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Purchase Costs by Product</h3>
              <button onClick={() => setShowChart(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="w-full h-64 md:h-96">
              <ResponsiveContainer>
                <BarChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => `${currencySymbol}${val.toFixed(2)}`} />
                  <Bar dataKey="price" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
