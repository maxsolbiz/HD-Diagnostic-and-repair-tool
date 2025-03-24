import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Benchmark from "./pages/Benchmark";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const App = () => {
  return (
    <Router>
      <div className="bg-gray-900 text-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/benchmark" element={<Benchmark />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
