import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const TeamMemberSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [storeId, setStoreId] = useState(null);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email_address: '',
    phone_number: '',
    role: 'attendant',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sId = params.get('store_id');
    if (sId) {
      setStoreId(parseInt(sId, 10));
    } else {
      setError('Missing store identifier in invite.');
    }
  }, [location.search]);

  const arrayBufferToHex = (buffer) =>
    Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');

  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setNotification('');

    if (!storeId) {
      setError('Store information is missing.');
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);

      const { error: insertError } = await supabase
        .from('store_users')
        .insert({
          store_id: storeId,
          full_name: formData.full_name,
          email_address: formData.email_address,
          phone_number: formData.phone_number,
          role: formData.role,
          password: hashedPassword,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setNotification('Signup successful! Redirecting to the team dashboard...');
        setTimeout(() => {
          navigate('/team-dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`);
    }
  };

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-700 rounded shadow mt-24">
      <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 mb-4">
        Join the Team
      </h2>
      {notification && (
        <div className="mb-4 p-2 text-green-600 text-center">{notification}</div>
      )}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Full Name</label>
          <input
            type="text"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Email Address</label>
          <input
            type="email"
            name="email_address"
            required
            value={formData.email_address}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Phone Number</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="attendant">Attendant</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Password</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-700"
        >
          Join the Team
        </button>
      </form>
    </div>
  );
};

export default TeamMemberSignup;
