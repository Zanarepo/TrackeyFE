import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';

export default function Login() {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const navigate = useNavigate();

  // Helper: Convert array buffer into hex string.
  const arrayBufferToHex = (buffer) => {
    return Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');
  };

  // Helper: Hash the password with SHA-256.
  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setNotification('');
    setLoading(true);

    try {
      const hashedPassword = await hashPassword(password);

      // Try to query the 'stores' table first for a store owner.
      const { data: ownerData, error: ownerError } = await supabase
        .from('stores')
        .select('*')
        .eq('email_address', emailAddress)
        .eq('password', hashedPassword)
        .maybeSingle();

      if (ownerError) {
        console.error(ownerError);
      }
      
      if (ownerData) {
        // Found a store owner.
        localStorage.setItem('store_id', ownerData.id);
        // Optionally store a user_id if needed for owners
        localStorage.setItem('user_id', ownerData.id);
        setNotification('Login successful! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/dashboard'); // Redirect to store owner dashboard.
        }, 1000);
      } else {
        // Try the 'store_users' table for a team member.
        const { data: teamData, error: teamError } = await supabase
          .from('store_users')
          .select('*')
          .eq('email_address', emailAddress)
          .eq('password', hashedPassword)
          .maybeSingle();

        if (teamError) {
          console.error(teamError);
        }
        
        if (teamData) {
          // Found a team member. Save both the team user's id and the store id.
          localStorage.setItem('store_id', teamData.store_id);
          localStorage.setItem('user_id', teamData.id);
          setNotification('Login successful! Redirecting to the team dashboard...');
          setTimeout(() => {
            navigate('/team-dashboard'); // Redirect to team dashboard.
          }, 1000);
        } else {
          setNotification('Invalid email or password. Please try again.');
        }
      }
    } catch (err) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-indigo-800 mb-6 text-center">Store Login</h1>
        {notification && (
          <div className="mb-4 p-2 text-indigo-800 text-center rounded">
            {notification}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-indigo-800 font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
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
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <a href="/forgot-password" className="text-sm text-indigo-800 hover:underline">
              Forgot password?
            </a>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-blue-900 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
