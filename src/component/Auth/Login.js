import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessOptions, setAccessOptions] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // SHA-256 → hex
  const hashPwd = async (plain) => {
    const buf = new TextEncoder().encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Called when user picks which dashboard to enter
  const pickAccess = (opt, allAccess) => {
    // Log allAccess for debugging
    console.log('allAccess:', allAccess);

    // Store all access IDs in user_access
    const userAccess = {
      store_ids: allAccess
        .filter(a => a.storeId)
        .map(a => a.storeId),
      owner_id: allAccess.find(a => a.ownerId)?.ownerId || null,
      user_ids: allAccess
        .filter(a => a.userId)
        .map(a => a.userId),
      admin_id: allAccess.find(a => a.adminId)?.adminId || null,
      role: opt.role || opt.type,
      screenclipExtensionId: opt.screenclipExtensionId || null
    };

    localStorage.setItem('user_access', JSON.stringify(userAccess));

    // Set individual keys for backward compatibility
    // Prioritize opt.storeId for owner role, fallback to first storeId from allAccess
    const storeId = opt.storeId || allAccess.find(a => a.storeId)?.storeId || '3'; // Default to 3 if no storeId found
    const ownerId = allAccess.find(a => a.ownerId)?.ownerId || '1'; // Ensure owner_id is always set

    localStorage.setItem('store_id', storeId);
    localStorage.setItem('owner_id', ownerId);

    // Log the set values for debugging
    console.log('Set localStorage:', { store_id: storeId, owner_id: ownerId, user_access: userAccess });

    // Navigate to the selected dashboard
    switch (opt.type) {
      case 'owner':
        navigate('/dashboard');
        break;
      case 'store_owner':
        navigate('/owner-dashboard');
        break;
      case 'team':
        navigate('/team-dashboard');
        break;
      case 'admin':
      case 'superadmin':
        navigate('/admin-dashboard');
        break;
      default:
        break;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hashed = await hashPwd(password);

      // 1) Fetch store owners
      const { data: owners = [], error: ownerErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('email_address', email)
        .eq('password', hashed);

      // 2) Fetch team members + store name via foreign select
      const { data: teamData = [], error: teamErr } = await supabase
        .from('store_users')
        .select('id, role, store_id, stores(id, shop_name)')
        .eq('email_address', email)
        .eq('password', hashed);

      // 3) Fetch admins
      const { data: adminData = [], error: adminErr } = await supabase
        .from('admins')
        .select('id, role')
        .eq('email', email)
        .eq('password', hashed);

      // 4) Fetch store owners (multi-store)
      const { data: storeOwnersData = [], error: storeOwnerErr } = await supabase
        .from('store_owners')
        .select('id, full_name')
        .eq('email', email);

      if (ownerErr || teamErr || adminErr || storeOwnerErr) {
        console.error(ownerErr, teamErr, adminErr, storeOwnerErr);
        setError('An error occurred. Please try again.');
        setLoading(false);
        return;
      }

      // Build all possible accesses
      const opts = [];

      owners.forEach((o) => {
        opts.push({
          type: 'owner',
          label: `Single Store Dashboard: ${o.shop_name}`,
          storeId: o.id,
          role: 'owner',
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp'
        });
      });

      teamData.forEach((u) => {
        opts.push({
          type: 'team',
          label: `${u.role.charAt(0).toUpperCase() + u.role.slice(1)} @ ${u.stores.shop_name}`,
          storeId: u.store_id,
          userId: u.id,
          role: u.role,
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp'
        });
      });

      storeOwnersData.forEach((so) => {
        opts.push({
          type: 'store_owner',
          label: `Multi-Store Dashboard (${so.full_name})`,
          ownerId: so.id,
          role: 'store_owner',
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp'
        });
      });

      adminData.forEach((a) => {
        opts.push({
          type: a.role === 'superadmin' ? 'superadmin' : 'admin',
          label: `${a.role.charAt(0).toUpperCase() + a.role.slice(1)} Panel`,
          adminId: a.id,
          role: a.role,
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp'
        });
      });

      // Log opts for debugging
      console.log('Access Options:', opts);

      if (opts.length === 0) {
        setError('Invalid credentials or no access.');
      } else if (opts.length === 1) {
        // Only one access, go straight there
        pickAccess(opts[0], opts);
      } else {
        // Multiple accesses: show selection UI
        setAccessOptions(opts);
      }
    } catch (e) {
      console.error(e);
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Selection UI if multiple accesses
  if (accessOptions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-6 rounded shadow max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-indigo-800 mb-4">
            Choose Your Dashboard
          </h2>
          {accessOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => pickAccess(opt, accessOptions)}
              className="block w-full mb-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow max-w-md w-full"
      >
        <h1 className="text-2xl font-bold text-indigo-800 mb-6 text-center">
          Sign In
        </h1>
        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-indigo-800 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-indigo-800 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}