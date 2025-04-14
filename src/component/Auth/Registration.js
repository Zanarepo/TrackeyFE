// RegisterAccount.jsx
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';

export default function RegisterAccount() {
  // Form fields state
  const [shopName, setShopName] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  const [password, setPassword] = useState('');

  // Toggle for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Notification and loading state
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  // Utility function: ArrayBuffer to hex string
  const arrayBufferToHex = (buffer) => {
    return Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');
  };

  // Hash the password using the Web Crypto API (SHA‑256)
  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification('');
    
    // Validate password length
    if (password.length < 6) {
      setNotification("Password must be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);
  
      // Insert into the stores table using Supabase
      const { error } = await supabase.from('stores').insert([
        {
          shop_name: shopName,
          full_name: fullName,
          email_address: emailAddress,
          nature_of_business: natureOfBusiness,
          password: hashedPassword,
        },
      ]);
  
      if (error) {
        // Handle duplicate email error
        if (error.message.includes("duplicate key value violates unique constraint")) {
          setNotification("This email address is already registered. Please use another email or log in.");
        } else {
          setNotification(`Error: ${error.message}`);
        }
      } else {
        setNotification("Registration successful!");
        // Clear form fields upon success
        setShopName('');
        setFullName('');
        setEmailAddress('');
        setNatureOfBusiness('');
        setPassword('');
      }
    } catch (err) {
      setNotification(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">Register Your Store</h1>
        {notification && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 text-center rounded">
            {notification}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Store Identifier for reports"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Name"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Email for login and alerts"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Nature of Business</label>
            <input
              type="text"
              value={natureOfBusiness}
              onChange={(e) => setNatureOfBusiness(e.target.value)}
              placeholder="e.g., Boutique, Retail, etc."
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Password must be at least 6 characters.</p>
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
