import React, { useState, useEffect } from 'react';
import { 

  FaMoneyBillWave,


  FaBars,
  FaTimes,
  FaStore,
  FaConciergeBell,

  
} from 'react-icons/fa';

import AdminProfile from './AdminProfile';
import Stores from './Stores';
import StoreUsers  from './StoreUsers';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('AdminProfile');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle dark mode by adding or removing the "dark" class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
     

      
      
        case 'Stores':
          return (
            <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
              <Stores />
            </div>
  
  
          );

  
          
          
  
      case 'StoreUsers':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <StoreUsers />
          </div>
        ); 

        case 'AdminProfile':
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <AdminProfile />
          </div>
        ); 
       
        





  







        
      default:
        return (
          <div className="w-full bg-white dark:bg-gray-700 rounded-lg shadow p-4">
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
    <div className="flex h-screen bg-gray-200 dark:bg-gray-700 mt-20">
      {/* Sidebar */}
      <aside 
        className={`transition-all duration-300 bg-gray-100 dark:bg-gray-800 ${sidebarOpen ? "w-64" : "w-0"} md:w-64 flex-shrink-0`}
      >
        <div className={`${sidebarOpen ? "block" : "hidden"} md:block`}>
          <div className="p-6">
            {/* Mobile Header inside sidebar */}
            <div className="flex md:hidden items-center justify-between">
              <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">Menu</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-indigo-800 dark:text-indigo-200">
                <FaTimes size={24} />
              </button>
            </div>
            <nav className="mt-4">
              <ul className="space-y-2">
                
              <li 
                  onClick={() => handleNavClick('AdminProfile')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${activeTab === 'Employees' ? 'bg-gray-400 dark:bg-indigo-600' : ''}`}
                >
                  <FaStore className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Admin Profile</span>
                </li>



                <li 
                  onClick={() => handleNavClick('StoreUsers')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${activeTab === 'Employees' ? 'bg-gray-400 dark:bg-indigo-600' : ''}`}
                >
                  <FaConciergeBell className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Store Users</span>
                </li>




           

                <li 
                  onClick={() => handleNavClick('Stores')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-indigo-600 transition ${activeTab === 'DebtTracker' ? 'bg-gray-400 dark:bg-indigo-600' : ''}`}
                >
                  <FaMoneyBillWave className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Stores</span>
                </li>


                

             


               



              </ul>
              
            </nav>
          </div>
          {/* Dark/Light Mode Toggle */}
          <div className="p-6 mt-auto flex items-center justify-between">
            <span className="text-indigo-800 dark:text-indigo-200">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                className="sr-only"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className="w-11 h-6 bg-indigo-800 dark:bg-gray-600 rounded-full transition-colors duration-300">
                <span 
                  className={`absolute left-1 top-1 bg-white dark:bg-indigo-200 w-4 h-4 rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-5' : ''}`}
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
          <button onClick={() => setSidebarOpen(true)} className="text-indigo-800 dark:text-indigo-200">
            <FaBars size={24} />
          </button>
          <h1 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
            {activeTab}
          </h1>
          <div style={{ width: 24 }}></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
