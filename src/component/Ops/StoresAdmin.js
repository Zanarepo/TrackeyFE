import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaBell,
  FaUser,
  FaBars,
  FaTimes,
  FaStore,
  FaChartLine,
  FaTasks,
  FaIdBadge,
  FaCrown,
} from 'react-icons/fa';
import OnboardingTour from './DashboardTour';
import Test from '../UserDashboard/Test';
import WhatsapUsers from '../UserDashboard/WhatsapUsers';
import MyStores from '../Ops/MyStores';
import Profile from '../UserDashboard/Profile';
import StoreOwnersEmployees from '../UserDashboard/StoreOwnersEmployees';
import MultiSales from './MultiSales';
import MultiInventory from './MultiInventory';
import StoreNotications from './StoreNotications';
import MultiDebt from './MultiDebt';
import PricingFeatures from '../Payments/PricingFeatures';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('My Stores');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Check if tour has been shown before
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
      case 'My Stores':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <MyStores />
          </div>
        );

      case 'Multi Sales':
        return (
          <div className="w-full bg-white dark:bg-gray-700 p-4">
            <MultiSales />
          </div>
        );

      case 'Multi Inventory':
        return (
          <div className="w-full bg-white dark:bg-gray-700 p-4">
            <MultiInventory />
          </div>
        );

      case 'Multi Debts':
        return (
          <div className="w-full bg-white dark:bg-gray-700 p-4">
            <MultiDebt />
          </div>
        );

      case 'VDashboard':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4"></div>
        );

      case 'Test':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <Test />
          </div>
        );

      case 'Upgrade':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <PricingFeatures />
          </div>
        );

      case 'Variex':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4"></div>
        );

      case 'Employees':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <StoreOwnersEmployees />
          </div>
        );

      case 'Profile':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <Profile />
          </div>
        );

      case 'Store Notifications':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            <StoreNotications />
          </div>
        );

      default:
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
            Dashboard Content
          </div>
        );
    }
  };

  // Handle navigation click: update active tab and close sidebar on mobile
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 mt-20">
      <WhatsapUsers />
      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={handleTourClose}
        setActiveTab={setActiveTab}
      />
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 bg-gray-100 dark:bg-gray-900 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } md:w-64 flex-shrink-0`}
      >
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="p-6">
            {/* Mobile Header inside sidebar */}
            <div className="flex md:hidden items-center justify-between">
              <h2 className="text-xl font-bold text-indigo-800 dark:text-white">Menu</h2>
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
                  data-tour="my-stores"
                  onClick={() => handleNavClick('My Stores')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'My Stores' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Stores Dashboard: Manage your stores and their details"
                >
                  <FaStore className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Stores Dashboard</span>
                </li>

                <li
                  data-tour="multi-sales"
                  onClick={() => handleNavClick('Multi Sales')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Multi Sales' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Sales Dashboard: View and analyze sales across stores"
                >
                  <FaChartLine className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Sales Dashboard</span>
                </li>

                <li
                  data-tour="multi-inventory"
                  onClick={() => handleNavClick('Multi Inventory')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Multi Inventory' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Inventory Dashboard: Manage inventory across all stores"
                >
                  <FaTasks className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Inventory Dashboard</span>
                </li>

                <li
                  data-tour="multi-debts"
                  onClick={() => handleNavClick('Multi Debts')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Multi Debts' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Debtors Dashboard: Track and manage debts"
                >
                  <FaMoneyBillWave className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Debtors Dashboard</span>
                </li>

                <li
                  data-tour="store-notifications"
                  onClick={() => handleNavClick('Store Notifications')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Store Notifications' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Notifications: View store-related notifications"
                >
                  <FaBell className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Notifications</span>
                </li>

                <li
                  data-tour="upgrade"
                  onClick={() => handleNavClick('Upgrade')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Upgrade' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Upgrade: Upgrade your plan for more features"
                >
                  <FaCrown className="text-yellow-800 dark:text-yellow-800 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Upgrade</span>
                </li>

                <li
                  onClick={() => handleNavClick('Test')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Test' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="TESTING: Testing dashboard features"
                >
                  <FaStore className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">TESTING</span>
                </li>

                <li
                  data-tour="employees"
                  onClick={() => handleNavClick('Employees')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Employees' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Employees: Manage store employees"
                >
                  <FaIdBadge className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Employees</span>
                </li>

                <li
                  data-tour="profile"
                  onClick={() => handleNavClick('Profile')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${
                    activeTab === 'Profile' ? 'bg-indigo-200 dark:bg-indigo-600' : ''
                  }`}
                  aria-label="Profile: View and edit your profile"
                >
                  <FaUser className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Profile</span>
                </li>
              </ul>
            </nav>
          </div>
          {/* Dark/Light Mode Toggle */}
          <div
            data-tour="dark-mode"
            className="p-6 mt-auto flex items-center justify-between"
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
        {/* Mobile Header */}
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
          <div style={{ width: 24 }}></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;