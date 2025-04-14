import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Helper function using the Web Crypto API to hash the password with SHA-256.
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const LoginComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for role-based access:
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const navigate = useNavigate();

  const handleRoleSelection = (selectedRole) => {
    setShowRoleModal(false);
    // Route based on the selected role.
    if (selectedRole === 'admin' || selectedRole === 'superadmin') {
      navigate('/admindashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Fetch both admin and user records concurrently.
      const { data: adminData  } = await supabase
        .from('sprintify_admin')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      // If neither record exists, display error.
      if (!adminData && !userData) {
        setErrorMessage('Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      // Merge roles from both records (if available).
      let combinedRoles = [];
      let recordUsed = null;

      if (adminData) {
        recordUsed = adminData;
        if (adminData.role) {
          combinedRoles = adminData.role.split(',').map(r => r.trim());
        }
      }

      if (userData) {
        if (!recordUsed) {
          recordUsed = userData;
        }
        if (userData.role) {
          const userRoles = userData.role.split(',').map(r => r.trim());
          combinedRoles = Array.from(new Set([...combinedRoles, ...userRoles]));
        }
      }

      // Verify password.
      const hashedInputPassword = await hashPassword(password);
      if (hashedInputPassword !== recordUsed.password) {
        setErrorMessage('Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      // Store the normalized email in local storage.
      localStorage.setItem('userEmail', normalizedEmail);
      setSuccessMessage('Login successful! Redirecting shortly...');

      // If multiple roles exist, prompt user to choose one.
      if (combinedRoles.length > 1) {
        setAvailableRoles(combinedRoles);
        setShowRoleModal(true);
      } else {
        const chosenRole = combinedRoles[0] || '';
        if (chosenRole === 'admin' || chosenRole === 'superadmin') {
          navigate('/admindashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="max-w-md mx-auto p-4 border bg-yellow-600 rounded shadow mt-44">
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Login</h2>

        {/* Inline message displays */}
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 text-gray-100 font-bold">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Password Field with Toggle */}
          <div className="mb-4 relative">
            <label htmlFor="password" className="block mb-1 text-gray-100 font-bold">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-800 text-white p-2 rounded hover:bg-yellow-700"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow max-w-xs mx-auto">
            <h3 className="text-lg font-bold mb-4">Select a Role</h3>
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelection(role)}
                className="block w-full mb-2 p-2 bg-yellow-600 text-white rounded hover:bg-yellow-500"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginComponent;
