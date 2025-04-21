import React from "react";
import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";

const VariexInfo = () => {
  return (
    <div className="flex flex-col items-center text-center p-6 max-w-3xl mx-auto ">
      {/* Icon */}
      <PackageSearch size={40} className="text-yellow-700 dark:bg-gray-900 dark:text-indigo-500" />

      {/* Title */}
      <h2 className="text-3xl font-extrabold text-gray-800 mt-2 dark:bg-gray-900 dark:text-indigo-500">
        Variex Mode
      </h2>

      {/* Sliding Tagline */}
      <motion.p
        className="text-yellow-600 font-semibold text-lg italic mt-2 dark:bg-gray-900 dark:text-indigo-500"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        "Stay flexible. Stay ahead."
      </motion.p>

      {/* Description with Background */}
      <p className="bg-yellow-50 text-gray-700 mt-4 text-lg leading-relaxed p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white">
        Ideal for businesses with frequently changing stock levels and prices. Variex lets you stay on top of dynamic market conditions and price negotiations in real-time.
      </p>
    </div>
  );
};

export default VariexInfo;
