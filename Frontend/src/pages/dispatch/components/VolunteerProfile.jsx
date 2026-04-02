import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, Award, User, AlertCircle, Phone } from 'lucide-react';
import { BASE_URL } from '../../../utils/constants.js';

// FIXED: Added onAssignVolunteer and isAssigning to the props list
const VolunteerProfile = ({ volunteerId, onClose, onAssignVolunteer, isAssigning }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!volunteerId) {
      setData(null);
      return;
    }

    const fetchVolunteer = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = 
          localStorage.getItem('token') || 
          localStorage.getItem('accessToken') || 
          JSON.parse(localStorage.getItem('user'))?.token; 

        if (!token) {
          setError("Auth session missing. Please check your login storage.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${BASE_URL}/dispatch/user/${volunteerId}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          setData(result.data); 
        } else {
          setError(result.message || "Profile retrieval failed.");
        }
      } catch (err) {
        setError("Network error: Backend unreachable.");
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteer();
  }, [volunteerId]);

  return (
    <AnimatePresence>
      {volunteerId && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000]"
          />

          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[2001] border-l border-slate-200 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} /> Personnel Profile
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-500 font-medium tracking-wide">Syncing records...</p>
                </div>
              ) : error ? (
                <div className="p-10 text-center">
                  <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center gap-3">
                    <AlertCircle size={24} />
                    <span className="text-sm font-bold">{error}</span>
                  </div>
                </div>
              ) : data ? (
                <div className="p-8">
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl border-4 border-white">
                      {data.name?.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{data.name}</h3>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                      <User size={12} /> {data.role}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <Mail className="text-slate-400" size={18} />
                      <span className="text-sm font-bold text-slate-700">{data.email}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <Phone className="text-slate-400" size={18} />
                      <span className="text-sm font-bold text-slate-700">{data.phone || "No contact logged"}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Award size={14} className="text-blue-500" /> Tactical Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.skills?.map((skill, i) => (
                        <span key={i} className="bg-white px-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 border border-slate-200 shadow-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      Member Since: {new Date(data.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <button 
                onClick={() => onAssignVolunteer && onAssignVolunteer(data._id)}
                disabled={!data || isAssigning}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transmitting...
                  </>
                ) : (
                  "Confirm Field Assignment"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VolunteerProfile;