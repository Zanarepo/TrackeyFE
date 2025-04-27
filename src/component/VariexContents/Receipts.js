// SalesDashboard.jsx
import React, { useState } from 'react';
import DynamicInventory from '../DynamicSales/DynamicInventory';
import DynamicProducts  from '../DynamicSales/DynamicProducts';
import Receipts from '../VariexContents/Receipts'
import { FiBox, FiFileText, FiPackage } from 'react-icons/fi';

export default function SalesDashboard() {
  // which view is active: 'inventory', 'receipts', 'products' or null for main
  const [view, setView] = useState(null);

  // decide which component to render
  const renderMain = () => {
    switch (view) {
      case 'inventory': return <DynamicInventory />;
      case 'receipts':  return <Receipts />;
      case 'products':  return <DynamicProducts />;
      default:          return <div className="p-4 text-center text-gray-600">Welcome to Sales Dashboard</div>;
    }
  };

  // define the shortcut buttons
  const shortcuts = [
    { key: 'inventory', icon: <FiBox />,     label: 'Inventory' },
    { key: 'receipts',  icon: <FiFileText />, label: 'Receipts'  },
    { key: 'products',  icon: <FiPackage />,  label: 'Products'  },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Shortcut bar top-right */}
      <div className="fixed top-4 right-4 flex space-x-2 z-50">
        {shortcuts.map(btn => (
          <button
            key={btn.key}
            onClick={() => setView(prev => prev === btn.key ? null : btn.key)}
            title={btn.label}
            className={`p-2 rounded shadow transition-colors focus:outline-none 
              ${view === btn.key ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <span className="text-xl sm:text-2xl">
              {btn.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Main content area, with padding so shortcuts don't overlap */}
      <div className="pt-16 px-4 pb-8">
        {renderMain()}
      </div>
    </div>
  );
}
