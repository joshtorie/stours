import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import logo from '../../assets/STreet ART TOuRS.png';

export function Navbar() {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Street Art Tours Logo" className="h-10 w-auto" />
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/tour-create" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              Build Your Tour
            </Link>
            <Link 
              to="/admin" 
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Admin Dashboard"
            >
              <Settings className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}