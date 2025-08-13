
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Rental from './pages/Rental';
import Inventory from './pages/Inventory';
import Admin from './pages/Admin';

const App: React.FC = () => {
  return (
    <div className="bg-yamori-bg min-h-screen font-sans text-yamori-text">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rental" element={<Rental />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
