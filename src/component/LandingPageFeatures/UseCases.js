import React from 'react';
import { FiTag, FiShuffle } from 'react-icons/fi';

export default function PricingUseCases() {
  const cases = [
    {
      icon: <FiTag size={32} className="text-green-500 dark:text-green-300" />, 
      title: 'Simplex (Fixed Pricing)',
      desc: 'For shops with stable prices—like supermarkets and online stores—where rates rarely change.',
      example: 'A supermarket selling a 50kg bag of rice at ₦5,000 daily without variation.'
    },
    {
      icon: <FiShuffle size={32} className="text-blue-500 dark:text-blue-300" />, 
      title: 'Variex (Negotiable Pricing)',
      desc: 'For open‑market vendors where prices shift based on demand, supply, or customer negotiation.',
      example: 'A phone vendor in Lagos bargaining smartphone prices between ₦60,000–₦65,000 per customer.'
    }
  ];

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-indigo-200 mb-12">
        Simplex & Variex Features ?
      </h2>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {cases.map((item, idx) => (
          <div key={idx} className="group relative bg-indigo-700 dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-transparent group-hover:border-indigo-500 dark:group-hover:border-indigo-300">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                {item.icon}
              </div>
              <h3 className="ml-4 text-2xl font-bold text-white dark:text-white">
                {item.title}
              </h3>
            </div>
            <p className="text-white dark:text-gray-300 mb-6">
              {item.desc}
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Example:</span>
              <p className="mt-2 text-gray-600 dark:text-gray-300 italic">
                {item.example}
              </p>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
