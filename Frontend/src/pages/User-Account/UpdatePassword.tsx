import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Key, AlertCircle } from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js';

const UpdatePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. Please login again.');
      }

      // 2. Send the update password request
      const response = await fetch(`${BASE_URL}/users/update-password`, {
        method: 'POST', // Use POST or PATCH depending on your backend setup
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword: newPassword
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update password. Please check your current password.');
      }

      // Alert the user before redirecting
      alert('Password updated successfully! You will now be logged out. Please login again with your new password.');

      // 3. Hit the logout endpoint to destroy the old session
      try {
        await fetch(`${BASE_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
      } catch (logoutError) {
        console.error('Failed to notify server of logout, but clearing local session anyway.', logoutError);
      }

      // 4. Clear all local session data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // 5. Update context and redirect
      logout();
      navigate('/login');

    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 overflow-hidden max-w-md mx-auto p-8 sm:p-10 mt-10 transition-all hover:shadow-2xl hover:shadow-emerald-500/10">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shadow-sm">
          <Key className="h-6 w-6" />
        </div>
        Update Password
      </h2>

      {/* Error Message Display */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <div>
          <label htmlFor="current-password" className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
          <input
            type="password"
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white sm:text-sm px-4 py-3 border transition-all outline-none"
            required
          />
        </div>
        
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white sm:text-sm px-4 py-3 border transition-all outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white sm:text-sm px-4 py-3 border transition-all outline-none"
            required
          />
        </div>
        
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full inline-flex justify-center items-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-full shadow-lg text-white transition-all ${
              isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-105 shadow-emerald-500/25'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
          >
            <Key className="mr-2 h-5 w-5" /> 
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePassword;
