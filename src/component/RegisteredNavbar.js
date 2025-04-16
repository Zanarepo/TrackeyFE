import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-100 p-0 flex justify-center items-center z-50 shadow-md">
      <Link to="/">
        <img
          src="/Sprintify.png"
          alt="Sprintify Logo"
          className="h-20 w-auto"
        />
      </Link>
    </nav>
  );
};

export default Navbar;
