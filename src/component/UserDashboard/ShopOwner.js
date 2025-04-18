// Dashboard.js
import React, { useState } from 'react';
import ExpenseTracker from './ExpenseTracker';
import DebtTracker from './DebtTracker';
import ProductList from './ProductList';
import SalesTracker from './SalesTracker';
import Customers from './Customers';
import Inventory from './Inventory';
import { FaRegMoneyBillAlt, FaMoneyCheckAlt, FaBoxes, FaChartLine, FaUsers , FaTasks   } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('expense');

  const renderContent = () => {
    switch (activeTab) {
      case 'expense':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Track and manage all your store expenses. Add new expense entries, edit existing records, and review your spending history to keep costs under control.
            </p>
            <ExpenseTracker />
          </>
        );

      case 'debt':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Debts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Monitor customer debts: record amounts owed, track payments, and view outstanding balances. Team members can update payments; owners can finalize or remove entries.
            </p>
            <DebtTracker />
          </>
        );

      case 'products':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Products</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your product catalog: add new items or services, update pricing and stock levels, and remove discontinued products to keep your inventory up to date.
            </p>
            <ProductList />
          </>
        );

      case 'sales':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Sales</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Analyze your sales performance: view real-time sales data, compare daily and monthly figures, and generate reports to inform your business decisions.
            </p>
            <SalesTracker />
          </>
        );

        case 'Inventory':
          return (
            <>
              <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Inventory</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your inventory: add new products, update stock levels, and track product performance to ensure optimal stock management.
              </p>
              <Inventory />
            </>
          );
         
  

        case 'customers':
            return (
              <>
                <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Customers</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your customer base: add new customers, update contact details, and review customer records linked to your store.
                </p>
                <Customers />
              </>
            );
    

      default:
        return null;
    }
  };

  const tabs = [
    { key: 'expense',   label: 'Expenses', icon: <FaRegMoneyBillAlt className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'debt',      label: 'Debts',    icon: <FaMoneyCheckAlt className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'products',  label: 'Products', icon: <FaBoxes className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'sales',     label: 'Sales',    icon: <FaChartLine className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'customers',     label: 'Customers',    icon: <FaUsers className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'Inventory', label: 'Inventory',icon: <FaTasks    className="text-4xl text-indigo-600 mb-2" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-800 dark:text-white mb-2">
       Tracking Tools Dashboard
      </h1>
      {/* Descriptive subtitle 
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Get a comprehensive view of your store operations: track expenses, manage customer debts, oversee products, and analyze sales — all in one place.
      </p>*/}

      {/* Icon Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap gap-4 justify-center">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300
                ${activeTab === tab.key ? 'border-2 border-indigo-500' : ''}`}
            >
              {tab.icon}
              <span className="text-lg text-indigo-800 dark:text-white">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
