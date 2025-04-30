import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 shadow-lg">
      <div className="flex">
        {/* Left Side: Logo with white background */}
        <div className="flex items-center bg-white w-1/2 px-4 md:px-8">
          <Link to="/">
            <img
              src="/Sellytics.jpg"
              alt="Sellytics Logo"
              className="h-14 md:h-16 w-auto"
            />
          </Link>
        </div>
        
        {/* Right Side: Menu with gradient background */}
        <div className="flex justify-end items-center bg-gradient-to-r from-white to-indigo-800 w-1/2 px-4 md:px-8 font-bold">
          {/* Desktop Menu (visible on md and larger screens) */}
          <div className="hidden md:flex gap-6 items-center">
          <Link 
  to="/register" 
  className="bg-white hover:underline text-indigo-900 font-bold py-2 px-4 rounded-xl block text-center"
>
  Start for Free
</Link>
            <Link 
              to="/login" 
              className="hover:underline text-white font-bold"
            >
              Login
            </Link>
          </div>
          
          {/* Hamburger Icon (visible on mobile only) */}
          <button
            onClick={toggleMenu}
            className="md:hidden ml-2 focus:outline-none"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu (dropdown) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white text-indigo-800 flex flex-col items-start p-4 space-y-2">
          <Link
            to="/register"
            onClick={() => setIsMenuOpen(false)}
            className="hover:underline w-full font-bold"
          >
           Start for Free
          </Link>
          <Link
            to="/login"
            onClick={() => setIsMenuOpen(false)}
            className="hover:underline w-full font-bold"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
