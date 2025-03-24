import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-400">HDD Repair Tool</h1>
        <div className="space-x-4">
          <Link to="/" className="text-white hover:text-green-400">Dashboard</Link>
          <Link to="/scan" className="text-white hover:text-green-400">Scan</Link>
          <Link to="/benchmark" className="text-white hover:text-green-400">Benchmark</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
