
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpenIcon, CheckCircleIcon, Cog6ToothIcon, HomeIcon } from './icons';

const NavLink: React.FC<{ to: string; children: React.ReactNode; }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-yamori-accent text-white'
          : 'text-gray-300 hover:bg-yamori-dark-hover hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
};

const Header: React.FC = () => {
  return (
    <header className="bg-yamori-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white tracking-wider">書籍管理</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/"><HomeIcon />ホーム</NavLink>
            <NavLink to="/rental"><BookOpenIcon />貸出/返却</NavLink>
            <NavLink to="/inventory"><CheckCircleIcon />在庫チェック</NavLink>
            <NavLink to="/admin"><Cog6ToothIcon />管理</NavLink>
          </nav>
        </div>
      </div>
      {/* Mobile Nav */}
      <nav className="md:hidden bg-yamori-dark border-t border-gray-700 p-2 flex justify-around">
          <NavLink to="/"><HomeIcon /></NavLink>
          <NavLink to="/rental"><BookOpenIcon /></NavLink>
          <NavLink to="/inventory"><CheckCircleIcon /></NavLink>
          <NavLink to="/admin"><Cog6ToothIcon /></NavLink>
      </nav>
    </header>
  );
};

export default Header;
