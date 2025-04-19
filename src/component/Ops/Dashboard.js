import React, { useState } from 'react';
import ProductsPurchaseCost from '../UserDashboard/ProductsPurchaseCost';
import SalesMetrics from '../UserDashboard/SalesMetrics';
import { FaDollarSign, FaChartBar } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('productCost');

  const tabStyle = (isActive) => `
    flex items-center gap-2 px-4 py-2 rounded-lg shadow 
    hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-300 
    ${isActive ? 'border-2 border-indigo-500 bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
  `;

  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900">
      {/* Icon Navigation */}
      <div className="flex flex-wrap justify-center gap-4 py-4">
        <button
          onClick={() => setActiveTab('productCost')}
          className={tabStyle(activeTab === 'productCost')}
        >
          <FaDollarSign className="text-2xl text-indigo-600" />
          <span className="text-base text-indigo-800 dark:text-white">Product Cost</span>
        </button>

        <button
          onClick={() => setActiveTab('salesMetrics')}
          className={tabStyle(activeTab === 'salesMetrics')}
        >
          <FaChartBar className="text-2xl text-indigo-600" />
          <span className="text-base text-indigo-800 dark:text-white">Sales Metrics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-2 md:px-6">
        {activeTab === 'productCost' && (
          <>
            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-2">
              Product Purchase Cost
            </h2>
            <ProductsPurchaseCost />
          </>
        )}

        {activeTab === 'salesMetrics' && (
          <>
            <h2 className="text-xl font-semibold text-indigo-800 dark:text-white mb-2">
              Sales Metrics Dashboard
            </h2>
            <SalesMetrics />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
