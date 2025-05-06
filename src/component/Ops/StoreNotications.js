import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NotificationsTable() {
  const [notifications, setNotifications] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState(null);

  const ownerId = Number(localStorage.getItem('owner_id'));

  // Format activity type to user-friendly string
  const formatActivityType = (activityType) => {
    return activityType
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format detail keys for display
  const formatDetailKey = (key) => {
    return key
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Memoize loadNotifications to stabilize it for useEffect
  const loadNotifications = useCallback(
    async (order) => {
      try {
        if (!ownerId) {
          setError('No owner ID found in local storage.');
          toast.error('No owner ID found. Please log in.');
          setNotifications([]);
          return;
        }

        // Fetch all stores for the owner
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id, shop_name')
          .eq('owner_user_id', ownerId);
        if (storesError) {
          throw new Error(`Error fetching stores: ${storesError.message}`);
        }
        if (!stores || stores.length === 0) {
          setNotifications([]);
          setError('No stores found for this owner.');
          toast.error('No stores found for this owner.');
          return;
        }

        const storeIds = stores.map(store => store.id);

        // Fetch notifications for all owned stores, joining with stores for shop_name
        const { data, error } = await supabase
          .from('notifications')
          .select('*, stores!inner(shop_name)')
          .in('store_id', storeIds)
          .order('timestamp', { ascending: order === 'asc' });
        if (error) {
          throw new Error(`Error fetching notifications: ${error.message}`);
        }

        // Map notifications to include shop_name from stores
        const notificationsWithShop = (data ?? []).map(notification => ({
          ...notification,
          shop_name: notification.stores?.shop_name || 'N/A',
        }));

        setNotifications(notificationsWithShop);
        setError(null);
      } catch (err) {
        console.error(err.message);
        setNotifications([]);
        setError(err.message);
        toast.error(err.message);
      }
    },
    [ownerId]
  );

  useEffect(() => {
    loadNotifications(sortOrder);
  }, [ownerId, sortOrder, loadNotifications]);

  const handleDelete = async id => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        throw new Error(`Error deleting notification: ${error.message}`);
      }
      await loadNotifications(sortOrder);
      toast.success('Notification deleted successfully.');
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 dark:bg-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold text-center mb-4">Notifications</h2>

      {error && (
        <div className="text-center text-red-500 mb-4">{error}</div>
      )}

      <div className="flex justify-end mb-4 space-x-2">
        <label className="self-center text-sm font-medium ">Sort by:</label>
        <select
          className="border border-gray-300 rounded px-2 py-1 dark:bg-gray-900 dark:text-white"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-200 ">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 dark:text-white">
              {['ID', 'Activity', 'Shop Name', 'Product Name', 'Amount', 'Qty', 'Time', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200 dark:bg-gray-900 dark:text-indigo-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => {
              const time = n.timestamp ? new Date(n.timestamp).toLocaleString() : 'N/A';
              const productName = n.details?.product_name || 'N/A';
              const amount = n.details?.amount || 'N/A';
              const quantity = n.details?.quantity || 'N/A';
              return (
                <tr key={n.id} className="">
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{n.id}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">
                    {formatActivityType(n.activity_type || 'N/A')}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{n.shop_name}</td>
                  <td className="px-4 py-2 border-b border-b border-gray-200 text-sm">{productName}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{amount}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{quantity}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm">{time}</td>
                  <td className="px-4 py-2 border-b border-gray-200 text-sm space-x-2">
                    <button
                      className="p-1 text-indigo-600 hover:text-indigo-800"
                      onClick={() => setViewDetails(n)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-1 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(n.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                  No notifications available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Details for #{viewDetails.id}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
             
              </div>
              {(viewDetails.details ?? {}) &&
                Object.entries(viewDetails.details ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{formatDetailKey(k)}</span>
                    <span className="text-gray-900">{String(v)}</span>
                  </div>
                ))}
              {(!viewDetails.details || Object.keys(viewDetails.details).length === 0) && (
                <div className="text-center text-gray-500">No details available</div>
              )}
            </div>
            <button
              className="mt-2 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={() => setViewDetails(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}