import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
//import ProductPurchaseCost from "./ProductsPurchaseCost";

const TIMEFRAMES = {
  daily: (date) => startOfDay(date),
  weekly: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  monthly: (date) => startOfMonth(date),
};

const CURRENCY_SYMBOLS = ["$", "€", "£", "¥", "₦"];

export default function SalesDashboard() {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeframe, setTimeframe] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [currency, setCurrency] = useState("₦");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [grandTotal, setGrandTotal] = useState(0);


  // Fetch sales
  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    async function fetchSales() {
      const { data, error } = await supabase
        .from("sales")
        .select(`product_id, quantity, unit_price, sold_at, products(name)`)
        .eq("store_id", storeId)
        .order('sold_at', { ascending: false });
      if (error) console.error(error);
      else {
        setSalesData(
          data.map((s) => ({
            productId: s.product_id,
            productName: s.products.name,
            quantity: s.quantity,
            unitPrice: parseFloat(s.unit_price),
            totalSales: s.quantity * parseFloat(s.unit_price),
            soldAt: s.sold_at,
          }))
        );
      }
    }
    fetchSales();
  }, []);

  // Filter & aggregate
  useEffect(() => {
    const start = TIMEFRAMES[timeframe](new Date());
    const map = {};
    salesData.forEach((item) => {
      const soldDate = new Date(item.soldAt);
      if (
        soldDate >= start &&
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        if (!map[item.productId]) {
          map[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            unitPrice: item.unitPrice,
            totalSales: 0,
          };
        }
        map[item.productId].totalQuantity += item.quantity;
        map[item.productId].totalSales += item.totalSales;
      }
    });
    setFilteredData(Object.values(map));
    setGrandTotal(Object.values(map).reduce((sum, item) => sum + item.totalSales, 0));

    setCurrentPage(1);
  }, [salesData, timeframe, searchQuery]);

  // Pagination
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Format currency with symbol only
  const formatCurrency = (value) => `${currency}${value.toFixed(2)}`;

  // CSV export
  const downloadCSV = () => {
    const header = ["Product", `Unit Price (${currency})`, "Quantity", `Total (${currency})`];
    const rows = filteredData.map((d) => [
      d.productName,
      d.unitPrice.toFixed(2),
      d.totalQuantity,
      d.totalSales.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${timeframe}_${currency}_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
  };

  // PDF export
  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    doc.setFontSize(18);
    doc.text(`Sales Report (${timeframe.toUpperCase()})`, 40, 60);
    doc.setFontSize(12);
    let y = 100;
    ["Product", `Unit Price (${currency})`, "Qty", `Total (${currency})`].forEach((h, i) => {
      doc.text(h, 50 + i * 130, y);
    });
    y += 20;
    filteredData.forEach((r) => {
      doc.text(r.productName, 50, y);
      doc.text(r.unitPrice.toFixed(2), 180, y);
      doc.text(r.totalQuantity.toString(), 310, y);
      doc.text(r.totalSales.toFixed(2), 380, y);
      y += 20;
      if (y > 700) { doc.addPage(); y = 60; }
    });
    doc.save(`sales_report_${timeframe}_${currency}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-24 bg-white shadow-lg rounded-lg dark:bg-gray-800 dark:text-white"> {/* changing backgrounf color update later */}
     
        {/* <ProductPurchaseCost />
       Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-4">
        <div>
          <h2 className="text-2xl text-indigo-800 font-bold dark:bg-gray-800 dark:text-white">Sales Dashboard</h2>
          <p className="text-sm text-gray-500 dark:bg-gray-800 dark:text-white">Quickly view and track your sales metrics.</p>
        </div>
        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(TIMEFRAMES).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition focus:outline-none  dark:bg-gray-800 dark:text-white hover:text-indigo-700 ${
                tf === timeframe
                  ? 'bg-indigo-600 text-white dark:bg-gray-800 dark:text-white hover:text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-indigo-300 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white"
          >
            {CURRENCY_SYMBOLS.map((sym) => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg dark:bg-gray-800 dark:text-white">
      <div className="flex justify-end mb-2">
        <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg font-semibold shadow-sm dark:bg-indigo-500 dark:text-white">
          Grand Total Sales: {formatCurrency(grandTotal)}
     </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-200 dark:bg-gray-800 dark:text-white">
            <tr className="text-gray-300 font-bold ">
                
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:bg-gray-800 dark:text-indigo-500">Product</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase dark:bg-gray-800 dark:text-indigo-500">Unit Price</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase dark:text-indigo-500">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase dark:text-indigo-500">Total Sales</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:text-white">
            {paginatedData.map((row) => (
              <tr key={row.productId} className="hover:bg-gray-50 ">
                <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium dark:bg-gray-800 dark:text-white">{row.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:bg-gray-800 dark:text-white">{formatCurrency(row.unitPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:bg-gray-800 dark:text-white">{row.totalQuantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700 dark:bg-gray-800 dark:text-white">{formatCurrency(row.totalSales)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-gray-800 dark:text-white">
            <tr>
              <td colSpan={2} className="px-6 py-3 text-right font-bold">Page {currentPage} of {pageCount}</td>
              <td colSpan={2} className="px-6 py-3 text-right space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-500 dark:text-white"
                >Prev</button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-500 dark:text-white"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 mt-16 dark:bg-gray-800 dark:text-white">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 dark:bg-gray-600 dark:text-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sales by Product</h3>
              <button onClick={() => setShowChart(false)} className="text-gray-800 hover:text-gray-900">Close</button>
            </div>
            <div className="w-full h-64 md:h-96 dark:bg-gray-900 dark:text-white">
              <ResponsiveContainer>
                <BarChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Bar dataKey="totalSales" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

           
          </div>
        </div>
      )}
    </div>
  );
}
