// Dashboard.js
import React, { useState } from 'react';
import ExpenseTracker from './ExpenseTracker';
import DebtTracker from './DebtTracker';
import SalesTracker from './SalesTracker';
import Customers from './Customers';
import {
  FaRegMoneyBillAlt,
  FaMoneyCheckAlt,
  FaChartLine,
  FaUsers,
} from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('expense');

  const renderContent = () => {
    switch (activeTab) {
      case 'expense':
        return (
          <>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Track and manage all your store expenses. Add new expense entries, edit existing ones, and view your expense history to maintain financial control.
            </p>
            <ExpenseTracker />
          </>
        );
      case 'debt':
        return (
          <>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Monitor customer debts: record amounts owed, payments made, and outstanding balances. Allow team members to update payment status as needed.
            </p>
            <DebtTracker />
          </>
        );
      case 'sales':
        return (
          <>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              View sales performance: track daily, weekly, and monthly sales figures, generate reports, and analyze trends to boost revenue.
            </p>
            <SalesTracker />
          </>
        );
      case 'customers':
        return (
          <>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
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
    { key: 'sales',     label: 'Sales',    icon: <FaChartLine className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'customers', label: 'Customers',icon: <FaUsers className="text-4xl text-indigo-600 mb-2" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-800 dark:text-white mb-6">
       Business Tools Dashboard
      </h1>

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
              <span className="text-lg text-indigo-800 dark:text-white">{tab.label}</span>
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
