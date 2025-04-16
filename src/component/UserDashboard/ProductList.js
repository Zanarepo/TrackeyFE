// ProductDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { MdEdit, MdDelete } from 'react-icons/md';

const currencyTable = [
  { code: 'NGN', name: 'Naira', rate: 1 },
  { code: 'USD', name: 'US Dollar', rate: 0.0026 },
  { code: 'EUR', name: 'Euro', rate: 0.0024 },
  { code: 'GBP', name: 'British Pound', rate: 0.0021 },
];

const pageSize = 10; // products per page

const ProductDashboard = () => {
  const storeId = localStorage.getItem('store_id');

  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    purchase_price: '',
    quantity: '',
    markup_percent: '',
  });
  const [customMarkup, setCustomMarkup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyTable[0].code);
  const [conversionRate, setConversionRate] = useState(currencyTable[0].rate);

  // Wrap fetchProducts with useCallback to fix missing dependency warnings.
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);
    if (error) {
      console.error(error.message);
      setNotification(error.message);
    } else {
      setProducts(data);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) fetchProducts();
  }, [storeId, fetchProducts]);

  // Update conversion rate when selectedCurrency changes.
  useEffect(() => {
    const currency = currencyTable.find((c) => c.code === selectedCurrency);
    if (currency) {
      setConversionRate(currency.rate);
    }
  }, [selectedCurrency]);

  // Handle form input changes.
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle markup dropdown.
  const handleMarkupChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setFormData({ ...formData, markup_percent: '' });
    } else {
      setFormData({ ...formData, markup_percent: value });
    }
  };

  // Submit handler for add/update.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const markup = formData.markup_percent || customMarkup;
    const payload = {
      store_id: storeId,
      product_name: formData.product_name,
      purchase_price: parseFloat(formData.purchase_price),
      quantity: parseInt(formData.quantity),
      markup_percent: parseFloat(markup),
    };

    if (editProduct) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editProduct.id);
      if (error) {
        setNotification(error.message);
      } else {
        setNotification('Product updated successfully!');
        setEditProduct(null);
        setShowModal(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        setNotification(error.message);
      } else {
        setNotification('Product added successfully!');
        setShowModal(false);
        fetchProducts();
      }
    }
    setFormData({
      product_name: '',
      purchase_price: '',
      quantity: '',
      markup_percent: '',
    });
    setCustomMarkup('');
  };

  // Delete product.
  const handleDelete = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setNotification(error.message);
    } else {
      setNotification('Product deleted successfully!');
      fetchProducts();
    }
  };

  // Open edit modal.
  const openEditModal = (product) => {
    setEditProduct(product);
    setFormData({
      product_name: product.product_name,
      purchase_price: product.purchase_price,
      quantity: product.quantity,
      markup_percent: product.markup_percent,
    });
    setShowModal(true);
  };

  // Search filtering.
  const filteredProducts = products.filter((prod) =>
    prod.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations.
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Export CSV.
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Product Name,Purchase Price,Quantity,Markup %,Selling Price,Unit Selling Price,Created At\n";
    filteredProducts.forEach((prod) => {
      // Convert prices using conversionRate.
      const purchasePrice = (prod.purchase_price * conversionRate).toFixed(2);
      const sellingPrice = (prod.selling_price * conversionRate).toFixed(2);
      const unitSellingPrice = (prod.unit_selling_price * conversionRate).toFixed(2);
      const row = [
        prod.product_name,
        purchasePrice,
        prod.quantity,
        prod.markup_percent,
        sellingPrice,
        unitSellingPrice,
        prod.created_at,
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Export PDF using jsPDF.
  const exportPDF = () => {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text("Products List", 10, y);
      y += 10;
      filteredProducts.forEach((prod) => {
        const purchasePrice = (prod.purchase_price * conversionRate).toFixed(2);
        const sellingPrice = (prod.selling_price * conversionRate).toFixed(2);
        const line = `Name: ${prod.product_name}, Price: ${purchasePrice}, Qty: ${prod.quantity}, Markup: ${prod.markup_percent}, Selling: ${sellingPrice}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save("products.pdf");
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with Currency, Search, Add & Export Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-2 md:space-y-0">
        <h1 className="text-2xl font-bold text-indigo-800">Products Dashboard</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="p-2 border rounded"
          >
            {currencyTable.map((cur) => (
              <option key={cur.code} value={cur.code}>
                {cur.name} ({cur.code})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded"
          />
          <button 
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Product
          </button>
          <button 
            onClick={exportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {notification}
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border">
          <thead className="bg-indigo-200">
            <tr>
              <th className="p-2 border">Product Name</th>
              <th className="p-2 border">Purchase Price</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Markup %</th>
              <th className="p-2 border">Selling Price</th>
              <th className="p-2 border">Unit Selling Price</th>
              <th className="p-2 border">Created At</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.map((prod) => (
              <tr key={prod.id} className="border-t">
                <td className="p-2">{prod.product_name}</td>
                <td className="p-2">
                  {(prod.purchase_price * conversionRate).toFixed(2)}
                </td>
                <td className="p-2">{prod.quantity}</td>
                <td className="p-2">{prod.markup_percent}</td>
                <td className="p-2">
                  {(prod.selling_price * conversionRate).toFixed(2)}
                </td>
                <td className="p-2">
                  {(prod.unit_selling_price * conversionRate).toFixed(2)}
                </td>
                <td className="p-2">
                  {new Date(prod.created_at).toLocaleString()}
                </td>
                <td className="p-2 flex space-x-2">
                  <button 
                    onClick={() => openEditModal(prod)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center"
                    title="Edit"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(prod.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                    title="Delete"
                  >
                    <MdDelete size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button 
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 mt-24">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">
              {editProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  className="p-2 border rounded mt-1"
                  placeholder="Enter product name"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleInputChange}
                  required
                  className="p-2 border rounded mt-1"
                  placeholder="Enter purchase price"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="p-2 border rounded mt-1"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Markup %</label>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <select
                    name="markup_percent"
                    value={formData.markup_percent}
                    onChange={handleMarkupChange}
                    className="p-2 border rounded mt-1 sm:w-1/2"
                    required
                  >
                    <option value="">Select markup</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20</option>
                    <option value="25">25%</option>
                    <option value="30">30%</option>
                    <option value="35">35%</option>
                    <option value="40">40%</option>
                    <option value="45">45%</option>
                    <option value="50">55%</option>
                    <option value="custom">Custom</option>
                  </select>
                  {formData.markup_percent === '' && (
                    <input
                      type="number"
                      step="0.01"
                      value={customMarkup}
                      onChange={(e) => setCustomMarkup(e.target.value)}
                      placeholder="Enter markup %"
                      className="p-2 border rounded mt-1 sm:w-1/2"
                      required
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditProduct(null);
                    setFormData({
                      product_name: '',
                      purchase_price: '',
                      quantity: '',
                      markup_percent: '',
                    });
                    setCustomMarkup('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  {editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDashboard;
