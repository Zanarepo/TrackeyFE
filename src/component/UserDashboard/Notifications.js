import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Trash2 } from 'lucide-react';

export default function NotificationsTable() {
  const [notifications, setNotifications] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  const storeId = localStorage.getItem('store_id') && parseInt(localStorage.getItem('store_id'), 10);

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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('store_id', storeId)
        .order('timestamp', { ascending: order === 'asc' });
      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
      }
    },
    [storeId]
  );

  useEffect(() => {
    if (!storeId) return;

    loadNotifications(sortOrder);
  }, [storeId, sortOrder, loadNotifications]);

  const handleDelete = async id => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('Error deleting notification:', error);
    loadNotifications(sortOrder);
  };

  return (
    <div className="max-w-4xl mx-auto p-0">
      <h2 className="text-2xl font-bold text-center mb-4">Notifications</h2>

      <div className="flex justify-end mb-4 space-x-2">
        <label className="self-center text-sm font-medium">Sort by:</label>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {['ID', 'Activity', 'Product Name', 'Amount', 'Qty', 'Time', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
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
                <tr key={n.id} className="hover:bg-gray-50 text-sm">
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{n.id}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{formatActivityType(n.activity_type || 'N/A')}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{productName}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{amount}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{quantity}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <span className="block truncate">{time}</span>
                </td>
                <td className="px-2 py-2 border-b border-gray-200 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => setViewDetails(n)}
                      aria-label="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(n.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
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
    </div>
  );
}