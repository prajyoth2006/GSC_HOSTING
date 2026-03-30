import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Role } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Key, Briefcase, MapPin, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Volunteer');
  
  const [adminKey, setAdminKey] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState(''); 
  const [isAvailable, setIsAvailable] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const payload: any = { name, email, password, role };

      if (role === 'Admin') {
        payload.adminKey = adminKey;
      } else if (role === 'Volunteer') {
        payload.skills = skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
        payload.isAvailable = isAvailable;
      }

      const response = await fetch('http://localhost:8000/api/v1/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      navigate('/login');
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Verify server connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm rotate-3">
            <UserPlus className="h-8 w-8 text-blue-600 -rotate-3" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">
            Network Enrollment
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Register for VolunMatch operational access
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
            
            {/* Base Fields */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Legal Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                  placeholder="contact@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Requested Role</label>
              <select
                id="role"
                className="block w-full px-4 py-3.5 border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm rounded-xl cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="Volunteer">Standard Volunteer</option>
                <option value="Worker">Field Worker</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>

            {/* Role Specific Fields */}
            {role === 'Admin' && (
              <div className="pt-4 border-t border-slate-100 mt-2">
                <label htmlFor="adminKey" className="block text-xs font-bold text-amber-600 uppercase tracking-widest mb-1.5 ml-1">Admin Security Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-amber-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    id="adminKey"
                    type="password"
                    required
                    className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-amber-200 bg-amber-50 placeholder-amber-400 text-amber-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all sm:text-sm"
                    placeholder="Enter Clearance Code"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                </div>
              </div>
            )}

            {role === 'Volunteer' && (
              <div className="pt-4 border-t border-slate-100 mt-2 space-y-4">
                <div>
                  <label htmlFor="skills" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Operational Skills</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="skills"
                      type="text"
                      className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                      placeholder="e.g. First Aid, Driving, Logistics (Comma separated)"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Base Location</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="location"
                      type="text"
                      className="appearance-none rounded-xl relative block w-full px-3 py-3.5 pl-11 border border-slate-200 bg-slate-50 placeholder-slate-400 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all sm:text-sm"
                      placeholder="City, State"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <label htmlFor="isAvailable" className="ml-3 block text-sm font-bold text-slate-700 cursor-pointer">
                    I am immediately available for deployment
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all`}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
          
          <div className="text-center text-sm font-medium text-slate-500 pt-4 border-t border-slate-100">
            Already verified?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Access Dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;