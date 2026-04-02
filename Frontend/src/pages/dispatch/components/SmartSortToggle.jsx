import React from 'react';
import { Sparkles, Activity } from 'lucide-react';

const SmartSortToggle = ({ aiEnabled, setAiEnabled, isAILoading }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${aiEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          <Sparkles size={20} className={aiEnabled ? "animate-pulse" : ""} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Neural Smart Sort</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
            {aiEnabled ? 'Active: Sorting by skill matrix & proximity' : 'Inactive: Sorting by proximity only'}
          </p>
        </div>
      </div>

      {/* The Toggle Switch */}
      <button 
        onClick={() => !isAILoading && setAiEnabled(!aiEnabled)}
        disabled={isAILoading}
        className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-300'} ${isAILoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-inner'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${aiEnabled ? 'transform translate-x-6' : ''}`}>
           {isAILoading && <Activity size={12} className="text-indigo-600 animate-spin" />}
        </div>
      </button>
    </div>
  );
};

export default SmartSortToggle;