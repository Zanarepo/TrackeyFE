// InviteGenerator.js
import React, { useState } from 'react';
import { FaWhatsapp, FaCopy } from 'react-icons/fa';

const InviteGenerator = () => {
  const [inviteLink, setInviteLink] = useState('');
  const storeId = localStorage.getItem('store_id');

  const generateInvite = () => {
    if (!storeId) {
      alert('Store ID not found. Please login.');
      return;
    }
    const link = `${window.location.origin}/team-signup?store_id=${storeId}`;
    setInviteLink(link);
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Join our team on Sellytics: ${inviteLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="p-4 dark:bg-gray-800 dark:text-white rounded shadow max-w-xl mx-auto dark:bg-gray-900 dark:text-indigo-600">
      <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-4 dark:bg-gray-800 dark:text-white dark:bg-gray-900 dark:text-indigo-600">
        Create Invite
      </h2>
      <button
        onClick={generateInvite}
        className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-700 mb-4 "
      >
        Generate Invite Link
      </button>

      {inviteLink && (
        <div className="space-y-2">
          <label className="block text-indigo-800 dark:text-indigo-200">
            Share this Invite Link with your team:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch ">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm dark:bg-indigo-600 dark:text-white"
            >
              <FaCopy className="mr-2" /> Copy
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <FaWhatsapp className="mr-2" /> WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
 
  );
};

export default InviteGenerator;
