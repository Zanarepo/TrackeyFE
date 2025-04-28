import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaStore, FaHome, FaArrowRight } from 'react-icons/fa';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ownerId) {
      setError('No owner_id found. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // fetch owner info
      const { data: owner, error: ownerErr } = await supabase
        .from('store_owners')
        .select('full_name')
        .eq('id', ownerId)
        .single();

      if (ownerErr) {
        setError(ownerErr.message);
        setLoading(false);
        return;
      }
      setOwnerName(owner.full_name);

      // fetch stores
      const { data, error: storesErr } = await supabase
        .from('stores')
        .select('id, shop_name, physical_address, phone_number')
        .eq('owner_user_id', ownerId)
        .order('created_at', { ascending: false });

      if (storesErr) {
        setError(storesErr.message);
      } else {
        setStores(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [ownerId]);

  if (loading) return <div className="p-6 text-center">Loading your dashboard…</div>;
  if (error) return <div className="p-6 text-red-600 text-center">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Welcome header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
          <FaHome /> Welcome, {ownerName}!
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          Here are your stores. Click on any card to manage that store&apos;s dashboard <FaArrowRight className="inline" />
        </p>
      </div>

      {/* Stores grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div
            key={store.id}
            onClick={() => {
              localStorage.setItem('store_id', store.id);
              navigate('/dashboard');
            }}
            className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FaStore className="text-2xl text-indigo-500 dark:text-indigo-300" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {store.shop_name}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {store.physical_address}
              </p>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Phone: {store.phone_number}</span>
              <span>ID: {store.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
