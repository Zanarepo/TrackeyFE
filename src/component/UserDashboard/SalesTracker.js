// DailySalesDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { MdEdit, MdDelete } from 'react-icons/md';

const pageSize = 10;

const DailySalesDashboard = () => {
  const storeId = localStorage.getItem('store_id');
  // Assuming the current user’s id is stored as well (for created_by)
  const userId = localStorage.getItem('user_id');

  // State for daily sales, products, notifications, search, pagination, and modal
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editSale, setEditSale] = useState(null);

  // Form data for a daily sale record
  const [saleForm, setSaleForm] = useState({
    product_name: '',
    sold_quantity: '',
    method_of_payment: '',
    description: '',
    unit_selling_price: '',
  });

  // Load products for suggestions from the products table.
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, product_name')
      .eq('store_id', storeId);
    if (error) {
      setNotification(`Error loading products: ${error.message}`);
    } else {
      setProducts(data);
    }
  }, [storeId]);

  // Load daily sales for the store.
  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) {
      setNotification(`Error loading sales: ${error.message}`);
    } else {
      setSales(data);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
      fetchSales();
    }
  }, [storeId, fetchProducts, fetchSales]);

  // Handle input changes in the sale form.
  const handleSaleFormChange = (e) => {
    setSaleForm({ ...saleForm, [e.target.name]: e.target.value });
  };

  // Helper: Find product by name (case-insensitive)
  const findProductByName = (name) =>
    products.find((p) => p.product_name.toLowerCase() === name.toLowerCase());

  // If product not found, create one with default values.
  const createProductIfNotExist = async (name) => {
    let product = findProductByName(name);
    if (!product) {
      // Insert new product with minimal default values.
      const defaults = {
        store_id: storeId,
        product_name: name,
        purchase_price: 0,       // default 0 – update later if needed
        quantity: 1,             // default quantity of 1
        markup_percent: 0,       // default markup 0%
      };
      const { data, error } = await supabase.from('products').insert(defaults).single();
      if (error) {
        setNotification(`Error creating product: ${error.message}`);
        return null;
      }
      // Refresh products list.
      fetchProducts();
      product = data;
    }
    return product;
  };

  // Handle submission of the sale form (for add or update).
  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    // Find or create product by name.
    const product = await createProductIfNotExist(saleForm.product_name);
    if (!product) return;

    // Prepare the payload for daily_sales.
    const payload = {
      store_id: storeId,
      product_id: product.id,
      sold_quantity: parseInt(saleForm.sold_quantity),
      method_of_payment: saleForm.method_of_payment,
      description: saleForm.description,
      unit_selling_price: parseFloat(saleForm.unit_selling_price),
      created_by: userId,
    };

    if (editSale) {
      // Update sale record.
      const { error } = await supabase
        .from('daily_sales')
        .update(payload)
        .eq('id', editSale.id);
      if (error) {
        setNotification(`Error updating sale: ${error.message}`);
      } else {
        setNotification('Sale updated successfully!');
      }
    } else {
      // Insert new sale.
      const { error } = await supabase.from('daily_sales').insert(payload);
      if (error) {
        setNotification(`Error adding sale: ${error.message}`);
      } else {
        setNotification('Sale added successfully!');
      }
    }
    // Reset form and refresh list.
    setSaleForm({
      product_name: '',
      sold_quantity: '',
      method_of_payment: '',
      description: '',
      unit_selling_price: '',
    });
    setEditSale(null);
    setShowModal(false);
    fetchSales();
  };

  // Delete sale record.
  const handleSaleDelete = async (id) => {
    const { error } = await supabase.from('daily_sales').delete().eq('id', id);
    if (error) {
      setNotification(`Error deleting sale: ${error.message}`);
    } else {
      setNotification('Sale deleted successfully!');
      fetchSales();
    }
  };

  // Open modal for editing sale.
  const openEditModal = (sale) => {
    // To display product name, lookup the product name via sale.product_id.
    const product = products.find((p) => p.id === sale.product_id);
    setSaleForm({
      product_name: product ? product.product_name : '',
      sold_quantity: sale.sold_quantity,
      method_of_payment: sale.method_of_payment,
      description: sale.description,
      unit_selling_price: sale.unit_selling_price,
    });
    setEditSale(sale);
    setShowModal(true);
  };

  // Search filter for daily sales.
  const filteredSales = sales.filter((sale) => {
    // Get product name for each sale.
    const product = products.find((p) => p.id === sale.product_id);
    const name = product ? product.product_name : '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const displayedSales = filteredSales.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 space-y-2 md:space-y-0">
        <h1 className="text-2xl font-bold text-indigo-800">Daily Sales</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <input
            type="text"
            placeholder="Search sales by product..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Sale
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {notification}
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border">
          <thead className="bg-indigo-200">
            <tr>
              <th className="p-2 border">Product Name</th>
              <th className="p-2 border">Sold Quantity</th>
              <th className="p-2 border">Method of Payment</th>
              <th className="p-2 border">Unit Selling Price</th>
              <th className="p-2 border">Total Sale</th>
              <th className="p-2 border">Created At</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSales.map((sale) => {
              const product = products.find((p) => p.id === sale.product_id);
              return (
                <tr key={sale.id} className="border-t">
                  <td className="p-2">{product ? product.product_name : 'N/A'}</td>
                  <td className="p-2">{sale.sold_quantity}</td>
                  <td className="p-2">{sale.method_of_payment}</td>
                  <td className="p-2">{parseFloat(sale.unit_selling_price).toFixed(2)}</td>
                  <td className="p-2">{parseFloat(sale.total_sale).toFixed(2)}</td>
                  <td className="p-2">{new Date(sale.created_at).toLocaleString()}</td>
                  <td className="p-2 flex space-x-2">
                    <button
                      onClick={() => openEditModal(sale)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center"
                      title="Edit"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleSaleDelete(sale.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                      title="Delete"
                    >
                      <MdDelete size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
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

      {/* Modal for Add/Edit Sale */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">
              {editSale ? 'Edit Sale' : 'Add Sale'}
            </h2>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              {/* Product name with suggestions using datalist */}
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={saleForm.product_name}
                  onChange={handleSaleFormChange}
                  list="productSuggestions"
                  placeholder="Type product name..."
                  required
                  className="p-2 border rounded mt-1"
                />
                <datalist id="productSuggestions">
                  {products.map((p) => (
                    <option key={p.id} value={p.product_name} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Sold Quantity</label>
                <input
                  type="number"
                  name="sold_quantity"
                  value={saleForm.sold_quantity}
                  onChange={handleSaleFormChange}
                  required
                  className="p-2 border rounded mt-1"
                  placeholder="Enter quantity sold"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Method of Payment</label>
                <select
                  name="method_of_payment"
                  value={saleForm.method_of_payment}
                  onChange={handleSaleFormChange}
                  required
                  className="p-2 border rounded mt-1"
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile Money">Mobile Money</option>
                  {/* Add more methods as needed */}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Unit Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="unit_selling_price"
                  value={saleForm.unit_selling_price}
                  onChange={handleSaleFormChange}
                  required
                  className="p-2 border rounded mt-1"
                  placeholder="Enter unit selling price"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  name="description"
                  value={saleForm.description}
                  onChange={handleSaleFormChange}
                  className="p-2 border rounded mt-1 resize-none"
                  placeholder="Optional notes..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditSale(null);
                    setSaleForm({
                      product_name: '',
                      sold_quantity: '',
                      method_of_payment: '',
                      description: '',
                      unit_selling_price: '',
                    });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  {editSale ? 'Update Sale' : 'Add Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySalesDashboard;
