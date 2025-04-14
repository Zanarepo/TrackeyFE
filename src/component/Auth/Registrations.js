import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

// Helper function using the Web Crypto API to hash the password with SHA-256.
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert bytes to a hex string.
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const RegistrationComponent = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Developers'); // default role
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Message states for inline display on the card.
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for toggling password visibility.
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate that all fields are filled.
    if (!fullName || !email || !password || !role) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms and Conditions.');
      return;
    }

    // Validate password: at least 6 characters with at least one letter and one number.
    // This regex allows any characters as long as the length is 6+ and contains at least one letter and one digit.
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'Password must be at least 6 characters long and include a mix of letters and numbers.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if the email is already registered.
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase());

      if (fetchError) {
        console.error('Error checking email uniqueness:', fetchError);
        setErrorMessage('An error occurred. Please try again later.');
        setIsSubmitting(false);
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        setErrorMessage('Email already used.');
        setIsSubmitting(false);
        return;
      }

      // Hash the password using the Web Crypto API.
      const hashedPassword = await hashPassword(password);

      // Insert the new user into the Supabase "users" table.
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            full_name: fullName,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role,
            others: '' // Extend this field as needed.
          }
        ]);

      if (insertError) {
        console.error('Error during registration:', insertError);
        setErrorMessage('Registration failed. Please try again.');
      } else {
        setSuccessMessage('Registration successful!');
        // Reset form fields on success.
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('Developers');
        setTermsAccepted(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMessage('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen mt-2 mb-24">
  <div className="w-full md:w-2/3 p-4 bg-yellow-600 border rounded shadow mt-24 md:mt-32 text-center">
    {/* Logon form content goes here */}


      <h2 className="text-2xl font-bold mb-4 text-gray-100 ">Register</h2>
      
      {/* Inline message displays */}
      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{successMessage}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="fullName" className="block mb-1 text-white font-bold">Full Name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Email */}
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
        
        {/* Password with toggle */}
        <div className="mb-4 relative">
          <label htmlFor="password" className="block mb-1 text-gray-100 font-bold">Password</label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter a secure password"
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
            <small className="block mt-1 text-gray-100 ">
            Password must be at least 6 characters long and include a mix of letters and numbers.
          </small>

        </div>
        
        {/* Role */}
        <div className="mb-4 " >
          <label htmlFor="role" className="block mb-1 text-gray-100 font-bold">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="Developers">Developers</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Others">Others</option>
          </select>
        </div>
        
        {/* Terms and Agreement */}
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="form-checkbox"
            />
            <span className="ml-2 text-gray-100">I agree to the Terms and Conditions</span>
          </label>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-800 text-white p-2 rounded hover:bg-yellow-700"
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
    </div>
  );
};

export default RegistrationComponent;
