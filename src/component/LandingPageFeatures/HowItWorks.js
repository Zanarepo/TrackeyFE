import React from 'react';
import { FiUserPlus, FiBox, FiPrinter, FiBarChart2 } from 'react-icons/fi';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-6 md:px-20 bg-white dark:bg-gray-900">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-indigo-900 dark:text-white mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
            <FiUserPlus size={32} />
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-white mb-2">
            Sign Up & Create Store
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Quickly register and set up your electronics store in minutes.
          </p>
        </div>
        {/* Step 2 */}
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
            <FiBox size={32} />
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-white mb-2">
            Add Products
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            List your phones, laptops, and electronics with quantities and pricing.
          </p>
        </div>
        {/* Step 3 */}
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
            <FiPrinter size={32} />
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-white mb-2">
            Record Sales & Track Stock
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Instantly log sales, monitor inventory levels, and manage returns.
          </p>
        </div>
        {/* Step 4 */}
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
            <FiBarChart2 size={32} />
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-white mb-2">
            Get Insights Instantly
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            View easy-to-read tables of stock, sales, and expenses for smarter decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
