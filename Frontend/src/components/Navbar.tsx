import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Note: We don't need the Dropdown import here anymore since 
// the new dashboard handles the logged-in profile menu!
import { HeartHandshake } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();

  // The Magic Trick: If the user is logged in, do not render this public navbar at all.
  // This lets your new HomePage layout take up the full screen seamlessly!
  if (user) {
    return null;
  }

  // If they are NOT logged in, show the standard public navbar
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <HeartHandshake className="h-8 w-8 text-indigo-600" />
              <span className="font-bold text-xl text-slate-900 tracking-tight">
                VolunMatch
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="space-x-4">
              <Link
                to="/login"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;