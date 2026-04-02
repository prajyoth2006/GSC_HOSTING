import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, Role } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home');
    }
  }, [user, authLoading, navigate]);

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const secureString = isLocalhost ? '' : 'Secure;';
    
    document.cookie = `${name}=${value};${expires};path=/;${secureString}SameSite=Strict`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid credentials');
      }

      const { user: userData, accessToken, refreshToken } = result.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setCookie('accessToken', accessToken, 1);
      setCookie('refreshToken', refreshToken, 7);

      login({ ...userData, role: userData.role as Role });
      navigate('/home');

    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Verifying Secure Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm rotate-3">
            <ShieldCheck className="h-8 w-8 text-blue-600 -rotate-3" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">
            VolunMatch Identity
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Secure login for registered personnel
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="email-address"
                  type="email"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="admin@volunmatch.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Security Credential</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all`}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Authenticate
                </>
              )}
            </button>
          </div>
          
          <div className="text-center text-sm font-medium text-slate-500 pt-4 border-t border-slate-100">
            Unregistered personnel?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Request Access Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;