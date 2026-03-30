import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, AlertCircle } from 'lucide-react';

const UpdateDetails = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Initialize state. Email is kept as a constant because it cannot be changed.
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  
  // Volunteer specific states
  // We join the array into a comma-separated string for the text input
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found. Please login again.');
      }

      // 1. Build the payload based on the user's role
      const payload: any = {
        name: name,
      };

      // Only add volunteer fields if the user is a volunteer
      if (user.role === 'Volunteer') {
        payload.skills = skills
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill !== ''); // Convert "Skill A, Skill B" back to ["Skill A", "Skill B"]
          
        payload.isAvailable = isAvailable;
      }

      // 2. Send the request to your backend
      // Replace '/update-details' with your exact endpoint route (e.g., /update-account, /profile)
      const response = await fetch('http://localhost:8000/api/v1/users/update-details', {
        method: 'POST', // Use PATCH or PUT depending on your backend setup
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Credentials': 'include', 
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update details.');
      }

      // 3. Update the AuthContext so the app knows about the new data instantly
      updateUser({
        name,
        ...(user.role === 'Volunteer' && { 
          skills: payload.skills, 
          isAvailable 
        })
      });

      // 4. Redirect to home upon success
      navigate('/home');
      
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      /* 1. Added w-full to take all available space
         2. Added max-w-6xl for a very wide look
         3. Added style as a backup to override parent constraints
      */
      className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 overflow-hidden w-full max-w-6xl mx-auto p-8 sm:p-12 mt-10 transition-all hover:shadow-2xl hover:shadow-emerald-500/10"
      style={{ width: '100%', maxWidth: '1100px' }} 
    >
      <h2 className="text-3xl font-extrabold text-slate-900 mb-10 flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shadow-inner">
          <Settings className="h-7 w-7" />
        </div>
        Update Account Details
      </h2>

      {/* ... (rest of your form code) */}
      <form onSubmit={handleUpdateDetails} className="space-y-8">
         <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {/* Using the 2-column grid makes the width more obvious */}
            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 border focus:border-emerald-500 outline-none transition-all"
                />
            </div>

            <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input type="email" value={email} disabled className="w-full rounded-xl bg-slate-100 text-slate-400 px-4 py-3 border cursor-not-allowed" />
            </div>

            <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Account Role</label>
                <input type="text" value={user.role} disabled className="w-full rounded-xl bg-slate-100 text-slate-400 px-4 py-3 border cursor-not-allowed" />
            </div>

            {user.role === 'Volunteer' && (
              <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Skills</label>
                  <input 
                    type="text" 
                    value={skills} 
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 border focus:border-emerald-500 outline-none transition-all"
                  />
              </div>
            )}
         </div>

         <div className="pt-8 flex justify-end">
            <button className="bg-emerald-500 text-white px-10 py-4 rounded-full font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30">
              Save Changes
            </button>
         </div>
      </form>
    </div>
  );
};

export default UpdateDetails;
