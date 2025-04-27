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
  const [otherBusiness, setOtherBusiness] = useState('');
  const [password, setPassword] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Toggle for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Notification and loading state
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  // Predefined options for Nature of Business
  const businessOptions = [
    "Retail",
    "Grocery Store",
    "Restaurant",
    "Bakery",
    "Fashion",
    "Electronics",
    "Health & Beauty",
    "Home & Garden",
    "Sports & Outdoors",
    "Automotive",
    "Toys & Games",
    "Books & Stationery",
    "Jewelry",
    "Pet Supplies",
    "Arts & Crafts",
    "Fitness & Wellness",
    "Travel & Leisure",
    "Hair & Beauty",
    "Boutique",
    "E-commerce",
    "Wholesale",
    "Other"
  ];

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

    if (password.length < 6) {
      setNotification("Password must be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Determine final nature of business based on dropdown selection
      const finalNatureOfBusiness =
        natureOfBusiness === "Other" && otherBusiness.trim()
          ? otherBusiness.trim()
          : natureOfBusiness;

      // Insert into the stores table using Supabase
      const { error } = await supabase.from('stores').insert([
        {
          shop_name: shopName,
          full_name: fullName,
          email_address: emailAddress,
          nature_of_business: finalNatureOfBusiness,
          password: hashedPassword,
          business_address: businessAddress,
        },
      ]);

      if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
          setNotification("This email address is already registered. Please use another email or log in.");
        } else {
          setNotification(`Error: ${error.message}`);
        }
      } else {
        setNotification("Registration successful!");
        // Clear form fields on success
        setShopName('');
        setFullName('');
        setEmailAddress('');
        setNatureOfBusiness('');
        setOtherBusiness('');
        setPassword('');
        setBusinessAddress('');
      }
    } catch (err) {
      setNotification(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-300 p-8 mt-20">
      {/* Remove max-w-md to allow container to expand fully on desktop */}
      <div className="w-full bg-white bg-opacity-75 p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">Create Your Store</h1>
        {notification && (
          <div className="mb-4 p-2 bg-indigo-100 text-blue-800 text-center rounded">
            {notification}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Business Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Your Business Name"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Business Address</label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Your Business Address"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Full Name</label>
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
            <label className="block text-indigo-800 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Business or Personal Email"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Nature of Business</label>
            <select
              value={natureOfBusiness}
              onChange={(e) => setNatureOfBusiness(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="">Select a business type</option>
              {businessOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {natureOfBusiness === "Other" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={otherBusiness}
                  onChange={(e) => setOtherBusiness(e.target.value)}
                  placeholder="Enter your business type"
                  className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  required
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Password</label>
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
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-200"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-sm text-indigo-500 mt-1">
              Password must be at least 6 characters.
            </p>
          </div>
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-800 text-white p-2 rounded hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
