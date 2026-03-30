/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage'; // This is your Layout Shell (Sidebar + Header)
import DashboardView from './pages/DashboardView';
import UserDirectory from './pages/UserDirectory';
import UserProfileView from './pages/UserProfileView';
import Profile from './pages/Profile';
import UpdateDetails from './pages/UpdateDetails';
import UpdatePassword from './pages/UpdatePassword';
import TasksListView from './pages/TasksListView';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          {/* Public Navbar (Hides itself automatically if user is logged in) */}
          <Navbar />
          
          <main className="flex-grow flex flex-col">
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* --- Protected Dashboard Layout --- */}
              <Route 
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard now lives at /home to avoid conflict with Landing Page */}
                <Route path="/home" element={<DashboardView />} />
                <Route path="/operations" element={<TasksListView />} />
                
                {/* 2. User Directory and Profile (Path fixed to /directory/:userId) */}
                <Route path="/directory" element={<UserDirectory />} />
                <Route path="/directory/:userId" element={<UserProfileView />} />
                
                {/* 3. Account Settings */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/update-details" element={<UpdateDetails />} />
                <Route path="/update-password" element={<UpdatePassword />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}