import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaUser,
  FaBars,
  FaTimes,
  FaConciergeBell,
  FaBell,
  FaIdBadge,
} from 'react-icons/fa';
import StoreUsersTour from './StoreUsersTour';
import WhatsapUsers from './WhatsapUsers';
import VariexDB from './VariexDB';
//import ExpenseTracker from './ExpenseTracker';
import StoreUserProfile from './StoreUsersProfile';
import Colleagues from './Colleagues';

import StoresSalesSummary from '../Ops/StoresSalesSummary';
import Notifications from './Notifications';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Toolkits');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Trigger tour on first load
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setIsTourOpen(true);
    }
  }, []);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Close tour and mark as seen
  const handleTourClose = () => {
    setIsTourOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'Sales Summary':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <StoresSalesSummary />
          </div>
        );

      case 'Toolkits':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <VariexDB />
          </div>
        );

    

      case 'Profile':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <StoreUserProfile />
          </div>
        );

      case 'Colleagues':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <Colleagues />
          </div>
        );

      case 'Notifications':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <Notifications />
          </div>
        );

      default:
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            Dashboard Content
          </div>
        );
    }
  };

  // Handle navigation click
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-200 dark:bg-gray-700 mt-20">
      <WhatsapUsers />
      <StoreUsersTour
        isOpen={isTourOpen}
        onClose={handleTourClose}
        setActiveTab={setActiveTab}
      />
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 bg-gray-100 dark:bg-gray-800 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } md:w-64 flex-shrink-0`}
      >
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="p-4 md:p-6">
            <div className="flex md:hidden items-center justify-between">
              <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
                Menu
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-indigo-800 dark:text-indigo-200"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <nav className="mt-4">
              <ul className="space-y-2">
                <li
                  data-tour="toolkits"
                  onClick={() => handleNavClick('Toolkits')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Toolkits' ? 'bg-gray-400 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Toolkits: Access your store management tools"
                >
                  <FaConciergeBell className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Toolkits</span>
                </li>
                <li
                  data-tour="sales-summary"
                  onClick={() => handleNavClick('Sales Summary')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Sales Summary' ? 'bg-gray-400 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Sales Dashboard: View and analyze sales data"
                >
                  <FaMoneyBillWave className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Sales Dashboard</span>
                </li>
                <li
                  data-tour="notifications"
                  onClick={() => handleNavClick('Notifications')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Notifications' ? 'bg-gray-400 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Notifications: Stay updated with store-related notifications"
                >
                  <FaBell className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Notifications</span>
                </li>
                <li
                  data-tour="colleagues"
                  onClick={() => handleNavClick('Colleagues')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Colleagues' ? 'bg-gray-400 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Colleagues: Manage your colleagues"
                >
                  <FaIdBadge className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Colleagues</span>
                </li>
                <li
                  data-tour="profile"
                  onClick={() => handleNavClick('Profile')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Profile' ? 'bg-gray-400 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Profile: View and edit your profile"
                >
                  <FaUser className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Profile</span>
                </li>
              
                
              </ul>
            </nav>
          </div>
          <div
            data-tour="dark-mode"
            className="p-4 md:p-6 mt-auto flex items-center justify-between"
          >
            <span className="text-indigo-800 dark:text-indigo-200">
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className="w-11 h-6 bg-indigo-800 dark:bg-gray-600 rounded-full transition-colors duration-300">
                <span
                  className={`absolute left-1 top-1 bg-white dark:bg-indigo-200 w-4 h-4 rounded-full transition-transform duration-300 ${
                    darkMode ? 'translate-x-5' : ''
                  }`}
                ></span>
              </div>
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-indigo-800 dark:text-indigo-200"
          >
            <FaBars size={24} />
          </button>
          <h1 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
            {activeTab}
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('hasSeenTour');
              setIsTourOpen(true);
            }}
            className="text-indigo-800 dark:text-indigo-200 text-sm"
          >
            Tour
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;