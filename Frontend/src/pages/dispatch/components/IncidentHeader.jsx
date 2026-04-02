import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, AlertTriangle, FileText } from 'lucide-react';

const IncidentHeader = ({ task }) => {
  if (!task) return null;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/70 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-8 mb-6 relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-10 ${
        task.severity === 5 ? 'bg-red-600' : task.severity === 4 ? 'bg-orange-600' : 'bg-amber-500'
      }`} />

      {/* Top Row: Badges */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <span className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg uppercase tracking-wider ${
          task.severity === 5 ? 'bg-red-50 text-red-600 border border-red-100' : 
          task.severity === 4 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
          'bg-amber-50 text-amber-600 border border-amber-100'
        }`}>
          <AlertTriangle size={16} />
          Level {task.severity} Critical
        </span>
        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200">
          {task.category}
        </span>
        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-100">
          Status: {task.status}
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6 relative z-10">{task.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Left Column: Context & Skills */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText size={16} /> Incident Report
            </h3>
            <p className="text-slate-700 text-lg leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100">
              "{task.rawReportText}"
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Required Personnel Skills</h3>
            <div className="flex flex-wrap gap-2">
              {task.requiredSkills?.length > 0 ? (
                task.requiredSkills.map((skill, index) => (
                  <span key={index} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-100 shadow-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic bg-slate-50 px-3 py-1 rounded-full text-sm border border-slate-200">
                  General physical assistance required. No specific certifications requested.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Mission Telemetry</h3>
          
          <div className="flex items-start gap-3">
            <MapPin className="text-blue-500 mt-1" size={20} />
            <div>
              <p className="font-semibold text-slate-800">Location</p>
              <p className="text-slate-500">{task.locationDescription || "Coordinates mapped."}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                GPS: {task.location?.coordinates[1].toFixed(4)}, {task.location?.coordinates[0].toFixed(4)}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-2"></div>

          <div className="flex items-start gap-3">
            <Clock className="text-blue-500 mt-1" size={20} />
            <div>
              <p className="font-semibold text-slate-800">Time Logged</p>
              <p className="text-slate-500">{formatTime(task.createdAt)}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-2"></div>

          <div className="flex items-start gap-3">
            <User className="text-blue-500 mt-1" size={20} />
            <div>
              <p className="font-semibold text-slate-800">Reporting Officer</p>
              {task.reportedBy ? (
                <p className="text-slate-500">{task.reportedBy.name} <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 ml-1">{task.reportedBy.role}</span></p>
              ) : (
                <p className="text-slate-500 italic">Automated / Anonymous Report</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default IncidentHeader;