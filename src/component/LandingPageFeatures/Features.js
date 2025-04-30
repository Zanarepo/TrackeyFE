import React from 'react';
import { FiBox, FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2, FiFileText, FiRefreshCw, FiPrinter, FiTag, FiBookOpen, FiActivity, FiLayers } from 'react-icons/fi';

export default function FeaturesGrid() {
  const features = [
    { icon: <FiBox size={24} />, title: 'Live Stock Alerts', desc: 'Get instant notifications when stock runs low.' },
    { icon: <FiTrendingUp size={24} />, title: 'Daily Sales Overview', desc: 'See your sales numbers at a glance.' },
    { icon: <FiDollarSign size={24} />, title: 'Easy Expense Log', desc: 'Quickly record and categorize expenses.' },
    { icon: <FiUsers size={24} />, title: 'Customer Hub', desc: 'Store customer info and track interactions.' },
    { icon: <FiBarChart2 size={24} />, title: 'Insightful Reports', desc: 'Simple tables for smarter decisions.' },
    { icon: <FiFileText size={24} />, title: 'Download Reports', desc: 'Export data as CSV or PDF in one click.' },
    { icon: <FiRefreshCw size={24} />, title: 'Returns Tracker', desc: 'Manage returned items seamlessly.' },
    { icon: <FiPrinter size={24} />, title: 'Quick Receipts', desc: 'Generate customer receipts on the spot.' },
    { icon: <FiTag size={24} />, title: 'Dynamic Pricing', desc: 'Adjust prices on the go for any item.' },
    { icon: <FiBookOpen size={24} />, title: 'Debt Manager', desc: 'Keep tabs on loans and repayments.' },
    { icon: <FiActivity size={24} />, title: 'Outstanding Bills', desc: 'Monitor unpaid supplies and credits.' },
    { icon: <FiLayers size={24} />, title: 'Multi‑Store View', desc: 'Control all your shops from one dashboard.' }
  ];

  return (
    <section className="py-12 px-4 bg-indigo-100 dark:bg-gray-900">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-indigo-900 dark:text-white mb-8">
        All-in-One Business Toolkit
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f, idx) => (
          <div key={idx} className="bg-indigo-800 dark:bg-gray-800 rounded-xl p-6 shadow-md flex items-start space-x-4 hover:shadow-lg transition">
            <div className="text-white dark:text-indigo-400 mt-1">
              {f.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-gray-400 dark:text-gray-300">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
