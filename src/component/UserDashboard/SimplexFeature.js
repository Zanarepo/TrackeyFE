import React from "react";
import { motion } from "framer-motion";
import { PackageCheck } from "lucide-react";

const SimplexInfo = () => {
  return (
    <div className="flex flex-col items-center text-center p-6 max-w-3xl mx-auto dark:bg-gray-900 dark:text-white">
      {/* Icon */}
      <PackageCheck size={40} className="text-green-700 dark:bg-gray-900 dark:text-indigo-500" />

      {/* Title */}
      <h2 className="text-3xl font-extrabold text-gray-800 mt-2 dark:bg-gray-900 dark:text-indigo-500">
        Simplex Mode
      </h2>

      {/* Sliding Tagline */}
      <motion.p
        className="text-green-600 font-semibold text-lg italic mt-2 dark:bg-gray-900 dark:text-indigo-500"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        "Set it and forget it."
      </motion.p>

      {/* Description with Background */}
      <p className="bg-green-50 text-gray-700 mt-4 text-lg leading-relaxed p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white">
        Best for businesses where prices and stock levels are stable over time. Use Simplex when your inventory and pricing rarely change, and you want a hassle-free, efficient management experience.
      </p>
    </div>
  );
};

export default SimplexInfo;