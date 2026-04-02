import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TriageList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTriageTasks = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch('http://localhost:8000/api/v1/dispatch/triage', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTasks(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch triage queue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTriageTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-medium tracking-wide">Establishing secure connection...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-12 text-center">
        <div className="flex justify-center mb-3">
          <AlertCircle className="text-emerald-500" size={36} />
        </div>
        <p className="text-emerald-600 font-bold text-lg">No Active Emergencies</p>
        <p className="text-slate-500 mt-1 font-medium">All tasks have been assigned. The board is clear.</p>
      </motion.div>
    );
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task, index) => (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          key={task._id}
          // CRITICAL UPDATE: We pass the full task data via React Router state
          onClick={() => navigate(`/dispatch/${task._id}`, { state: { taskData: task } })}
          className="group relative bg-white/60 backdrop-blur-xl border border-white/80 hover:border-blue-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:bg-white overflow-hidden"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.severity === 5 ? 'bg-red-500' : task.severity === 4 ? 'bg-orange-500' : 'bg-amber-400'}`} />
          <div className="flex justify-between items-center ml-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${task.severity === 5 ? 'bg-red-50 text-red-600 border border-red-100' : task.severity === 4 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  Level {task.severity}
                </span>
                <span className="text-slate-500 text-sm font-bold bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                  {task.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
              <div className="flex items-center gap-6 mt-3 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="truncate max-w-[200px] sm:max-w-md">{task.locationDescription || "Coordinates Logged"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  {formatTime(task.createdAt)}
                </div>
              </div>
            </div>
            <div className="h-10 w-10 ml-4 rounded-full bg-slate-50 group-hover:bg-blue-50 border border-slate-100 group-hover:border-blue-100 flex-shrink-0 flex items-center justify-center transition-all duration-300">
              <ChevronRight className="text-slate-400 group-hover:text-blue-600" size={20} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TriageList;