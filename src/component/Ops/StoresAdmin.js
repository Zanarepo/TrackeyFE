import React, { useState, useEffect } from 'react';
import { 

  FaMoneyBillWave,
  FaBell ,
  FaUser,
  FaBars,
  FaTimes,
  FaStore,
  //FaBoxOpen,
  FaChartLine,
  FaTasks,
  FaIdBadge,
  FaCrown ,
  
} from 'react-icons/fa';


import Test from '../UserDashboard/Test';
import WhatsAppChatPopup from '../UserDashboard/WhatsAppChatPopup';
import MyStores from '../Ops/MyStores'
import Profile from '../UserDashboard/Profile'
//import Employees from '../UserDashboard/Employees'
import StoreOwnersEmployees from '../UserDashboard/StoreOwnersEmployees'
import MultiSales from './MultiSales'
import MultiInventory from './MultiInventory'
import StoreNotications from './StoreNotications'
import MultiDebt from './MultiDebt'
import PricingFeatures from '../Payments/PricingFeatures'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('My Stores');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle dark mode by adding or removing the "dark" class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
     

      case 'My Stores':
        return (
          <div className="w-full bg-white dark:bg-gray-800  p-4">
           <MyStores/>
          </div>
        );
      

      case 'Multi Sales':
        return (
          <div className="w-full bg-white dark:bg-gray-700 p-4">
           <MultiSales/>
          </div>
        );
      

        case 'Multi Inventory':
          return (
            <div className="w-full bg-white dark:bg-gray-700 p-4">
             <MultiInventory/>
            </div>
          );

        
          case 'Multi Debts':
            return (
              <div className="w-full bg-white dark:bg-gray-700 p-4">
               <MultiDebt/>
              </div>
            );

        
        case 'VDashboard':
          return (
            <div className="w-full bg-white dark:bg-gray-800  p-4">
             
            </div>
  
  
          );
          
          case 'Test':
            return (
              <div className="w-full bg-white dark:bg-gray-800  p-4">
                <Test />
              </div>
    
    
            );

  

            case 'Upgrade':
              return (
                <div className="w-full bg-white dark:bg-gray-800  p-4">
                  <PricingFeatures />
                </div>
      
      
              );
  
    
  



   

        case 'Variex':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
          
          </div>
        ); 
       
        



      case 'Employees':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
           <StoreOwnersEmployees/>
          </div>


      );
    
      case 'Profile':
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
           <Profile/>
          </div>
        );



 
        case 'Store Notifications':
          return (
            <div className="w-full bg-white dark:bg-gray-800 p-4">
             <StoreNotications/>
            </div>
          );
  
  


      default:
        return (
          <div className="w-full bg-white dark:bg-gray-800 p-4">
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
    <div className="flex h-screen bg-white dark:bg-gray-900 mt-20">
      <WhatsAppChatPopup/>
      {/* Sidebar */}
      <aside 
        className={`transition-all duration-300 bg-gray-100 dark:bg-gray-900 ${sidebarOpen ? "w-64" : "w-0"} md:w-64 flex-shrink-0`}
      >
        <div className={`${sidebarOpen ? "block" : "hidden"} md:block`}>
          <div className="p-6">
            {/* Mobile Header inside sidebar */}
            <div className="flex md:hidden items-center justify-between">
              <h2 className="text-xl font-bold text-indigo-800 dark:text-white">Menu</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-indigo-800 dark:text-indigo-200">
                <FaTimes size={24} />
              </button>
            </div>
            <nav className="mt-4">
              <ul className="space-y-2">
  


              
                
           


                



           

                <li 
                  onClick={() => handleNavClick('My Stores')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'My Stores' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaStore  className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200"> Stores Dashboard</span>

              
                </li>

                <li 
                  onClick={() => handleNavClick('Multi Sales')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Multi Sales' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaChartLine className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200"> Sales Dashboard</span>

              
                </li>

                <li 
                  onClick={() => handleNavClick('Multi Inventory')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Multi Inventory' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaTasks className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200"> Inventory Dashboard</span>

              
                </li>




                <li 
                  onClick={() => handleNavClick('Multi Debts')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Multi Debts' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaMoneyBillWave  className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200"> Debtors Dashboard</span>

              
                </li>


                







                
                <li 
                  onClick={() => handleNavClick('Store Notifications')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'StoreNotications' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaBell  className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Notifications</span>

              
                </li>



                <li 
                  onClick={() => handleNavClick('Upgrade')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Upgrade' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaCrown   className="text-yellow-800 dark:text-yellow-800 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Upgrade</span>

              
                </li>

                
                
                {/* */}
                
                <li 
                  onClick={() => handleNavClick('Test')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Test' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaStore className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">TESTING</span>
                </li>



                

             


               



                <li 
                  onClick={() => handleNavClick('Employees')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'StoreOwnersEmployees' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaIdBadge  className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Employees</span>
                </li>

             

                <li 
                  onClick={() => handleNavClick('Profile')}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600 transition ${activeTab === 'Profile' ? 'bg-indigo-200 dark:bg-indigo-600' : ''}`}
                >
                  <FaUser className="text-indigo-800 dark:text-indigo-200 mr-3" />
                  <span className="text-indigo-800 dark:text-indigo-200">Profile</span>
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
