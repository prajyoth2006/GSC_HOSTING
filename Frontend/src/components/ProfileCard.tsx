import React, { useState, useEffect } from 'react';
import { 
  Mail, Briefcase, MapPin, Key, CheckCircle, 
  XCircle, AlertCircle, ShieldCheck, User as UserIcon, 
  Calendar, Fingerprint, Globe
} from 'lucide-react';

const ProfileCard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!accessToken) {
          throw new Error('No access token found. Please login again.');
        }

        const response = await fetch('http://localhost:8000/api/v1/users/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to fetch profile data');
        }

        setProfile(result.data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const renderLocation = (locationObj: any) => {
    if (!locationObj) return 'Not specified';
    if (typeof locationObj === 'string') return locationObj;
    if (locationObj.type === 'Point' && Array.isArray(locationObj.coordinates)) {
      const [lng, lat] = locationObj.coordinates;
      if (lng === 0 && lat === 0) return 'Location not set';
      return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
    }
    return 'Not specified';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Accessing Secure Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-8 rounded-2xl max-w-2xl mx-auto text-center shadow-sm">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Access Denied</h3>
        <p className="text-sm text-red-600 font-medium mt-1">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Personal Account</h2>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Verified User Profile</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Cover Gradient */}
            <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-950 relative">
               <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-tighter">
                 Active Session
               </div>
            </div>
            
            <div className="px-6 pb-8 text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 -mt-12 rounded-2xl border-4 border-white bg-blue-50 flex items-center justify-center text-4xl font-black text-blue-600 shadow-lg mx-auto transform -rotate-3 hover:rotate-0 transition-all duration-300">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                {profile.isAvailable && (
                  <div className="absolute bottom-0 right-0 h-6 w-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                )}
              </div>

              <h3 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h3>
              
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                  {profile.role}
                </span>
                {profile.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200">
                    {profile.category}
                  </span>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User ID</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">#{profile._id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">{profile.role === 'Admin' ? 'Management' : 'Standard'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Information Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
              Detailed Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Tile */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</span>
                </div>
                <p className="text-sm font-bold text-slate-800 ml-1">{profile.email}</p>
              </div>

              {/* Registration Date Tile */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined VolunMatch</span>
                </div>
                <p className="text-sm font-bold text-slate-800 ml-1">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Conditional Admin Key Tile */}
              {profile.role === 'Admin' && profile.adminKey && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 md:col-span-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-200 rounded-lg text-amber-700">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Primary Admin Security Key</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-amber-900 bg-white/60 border border-amber-200/50 px-4 py-3 rounded-xl shadow-inner">
                    {profile.adminKey}
                  </p>
                </div>
              )}

              {/* Conditional Volunteer Specific Tiles */}
              {profile.role === 'Volunteer' && (
                <>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Globe className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Location</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 ml-1">{renderLocation(profile.location)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg transition-colors ${profile.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                        {profile.isAvailable ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deployment Status</span>
                    </div>
                    <p className={`text-sm font-black ml-1 ${profile.isAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {profile.isAvailable ? 'AVAILABLE' : 'OFFLINE / BUSY'}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Skillsets</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill: string, i: number) => (
                          <span key={i} className="bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No skills currently linked to this profile.</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;