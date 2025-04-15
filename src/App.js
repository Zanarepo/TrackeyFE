import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./component/HomePage";

import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import RegisteredHomePage from './component/UserDashboard/RegisteredHomePage'
// Registered Users components
import Registration from './component/Auth/Registration'

import AdminDasboard from './component/SprintDashboard/AdminDasboard'


import AdminNav from './component/SprintDashboard/AdminNav';
import AdminRegistration from './component/Auth/AdminRegistration';
import Login from "./component/Auth/Login";
import Forgotpassword from './component/Auth/Forgotpassword'
import ResetPassword from './component/Auth/ResetPassword'


import RegisteredDashboards from './component/RegisteredDashboards'

















const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Primary navbar for all users */}

        
        <Navbar />
        <div className="flex-grow">
       
        
      


          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<Registration />} />
            
            <Route path="/login" element={<Login />} />
            
            <Route path="/forgot-password" element={<Forgotpassword />} />

            
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* premium routes duplicates */}
            
            
          {/* Dashboard*/}


          </Routes>
         
          <Routes>
          <Route element={<AdminNav />}>
          <Route path="/admindashboard" element={<AdminDasboard/>} />
          <Route path="/adminregister" element={<AdminRegistration/>} /> </Route>
          
          <Route path="/regdashboard" element={<RegisteredDashboards />} />
         
          
            
                    </Routes>



          {/* Dashbaord*/}

          <Routes>
            {/* Routes using the RegisteredNavbar layout */}
           
            <Route element={<RegisteredDashboards />}>
           
            </Route>
              <Route path="/dashboard" element={<RegisteredHomePage />} />
            
       

            
          </Routes>

























        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
