import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // FIXED IMPORT
import { MapPin, ShieldCheck, BrainCircuit, Rocket } from 'lucide-react';

const CandidateList = ({ 
  candidates, 
  aiEnabled, 
  isAILoading, 
  onSelectVolunteer, 
  onAssignVolunteer, 
  isAssigning 
}) => {
  
  if (isAILoading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-indigo-100 shadow-sm rounded-3xl p-12 flex flex-col items-center justify-center text-indigo-500 font-medium">
         <BrainCircuit size={32} className="animate-pulse mb-4 text-indigo-600" />
         Processing neural matrix and skill weighting...
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-white/40 border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 font-medium">
        No matching personnel found within the search radius.
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-100/50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="col-span-6 sm:col-span-4">Personnel Identification</div>
        <div className="hidden sm:block sm:col-span-3">Technical Qualifications</div>
        <div className="col-span-6 sm:col-span-3 text-right">Suitability Metrics</div>
        <div className="hidden sm:block sm:col-span-2 text-right">Action</div>
      </div>

      <div className="flex flex-col">
        <AnimatePresence mode="popLayout">
          {candidates.map((person, index) => {
            // FIXED: Handles both boolean (true) and string ID matching safely
            const isThisRowLoading = isAssigning === true || isAssigning === person._id;

            return (
              <motion.div
                key={person._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`group grid grid-cols-12 gap-4 px-6 py-4 items-center border-b hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer ${aiEnabled ? 'border-indigo-50/50' : 'border-slate-100/50'}`}
                onClick={() => onSelectVolunteer && onSelectVolunteer(person._id)}
              >
                
                {/* 1. Identity */}
                <div className="col-span-6 sm:col-span-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0 border ${aiEnabled ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {person.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{person.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <ShieldCheck size={12} className={aiEnabled ? "text-indigo-500" : "text-blue-500"} /> {person.category}
                    </div>
                  </div>
                </div>

                {/* 2. Skills (Hidden on Mobile) */}
                <div className="hidden sm:flex col-span-3 flex-wrap gap-1.5 items-center">
                  {person.skills && person.skills.length > 0 ? (
                    person.skills.slice(0, 2).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 truncate max-w-[100px]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Unspecified</span>
                  )}
                  {person.skills && person.skills.length > 2 && (
                    <span className="px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-400">
                      +{person.skills.length - 2}
                    </span>
                  )}
                </div>

                {/* 3. Metrics (Proximity OR AI Score) */}
                <div className="col-span-6 sm:col-span-3 flex flex-col items-end justify-center">
                  {aiEnabled && person.matchPercentage ? (
                    <>
                      <div className="flex items-center gap-1.5 font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm">
                        <BrainCircuit size={14} /> {person.matchPercentage}% Match
                      </div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                        {person.aiReasoning} • {person.distanceInKm}km
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                        <MapPin size={14} className="text-blue-500" /> {person.distanceInKm} km
                      </div>
                    </>
                  )}
                </div>

                {/* 4. Action Button */}
                <div className="col-span-12 sm:col-span-2 flex justify-end mt-3 sm:mt-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Stop row click from opening drawer
                      if (onAssignVolunteer) onAssignVolunteer(person._id);
                    }}
                    disabled={isThisRowLoading || isAssigning} // Disable if ANY assignment is running
                    className={`
                      relative overflow-hidden group
                      flex items-center justify-center gap-2
                      px-5 py-2.5 w-full sm:w-auto
                      text-xs font-bold uppercase tracking-wider text-white
                      rounded-xl shadow-sm transition-all duration-300
                      active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                      ${aiEnabled 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25 hover:shadow-indigo-500/40' 
                        : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 hover:shadow-slate-900/30'}
                    `}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {isThisRowLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deploying
                        </>
                      ) : (
                        <>
                          Deploy
                          <Rocket size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </span>
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                  </button>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CandidateList;