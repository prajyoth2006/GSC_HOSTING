import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom';

import { 
  ShieldAlert, MapPin, Search, Filter, ArrowUpDown, 
  ClipboardList, AlertCircle, User, UserCheck, 
  Wrench, X, Clock, Navigation, MoreVertical, 
  Edit, Trash2, Save, Plus
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"

// Exact categories matching your backend schema
const TASK_CATEGORIES = [
  'Medical', 'Rescue', 'Food & Water', 'Shelter', 
  'Sanitation', 'Labor', 'Transport', 'Supplies', 
  'Animal Rescue', 'Infrastructure', 'Other'
];

interface TaskUser {
  _id: string;
  name: string;
}

interface Task {
  _id: string;
  title: string;
  rawReportText: string;
  category: string;
  severity: number;
  status: string;
  locationDescription: string;
  location: { type: string; coordinates: number[] };
  requiredSkills: string[];
  reportedBy: TaskUser | string; 
  assignedVolunteer: TaskUser | string | null; 
  completionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TasksListView() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionTask, setActionTask] = useState<Task | null>(null);
  
  // Form States
  const [cancelNote, setCancelNote] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    severity: 1,
    locationDescription: '',
    requiredSkills: ''
  });

  const loadTasks = async () => {
    const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/v1/admins/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const result = await response.json();
      if (result.success) setTasks(result.data.taskList || []);
    } catch (err) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  // --- API Handlers ---
  const handleCancelSubmit = async () => {
    if (!actionTask) return;
    const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admins/tasks/${actionTask._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionNote: cancelNote })
      });
      if (response.ok) {
        setIsCancelModalOpen(false);
        setCancelNote('');
        loadTasks();
      }
    } catch (err) { console.error("Cancel failed"); }
  };

  const handleUpdateSubmit = async () => {
    if (!actionTask) return;
    const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const payload = {
      ...editForm,
      requiredSkills: editForm.requiredSkills.split(',').map(s => s.trim())
    };

    try {
      const response = await fetch(`http://localhost:8000/api/v1/admins/tasks/${actionTask._id}/update`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setIsEditModalOpen(false);
        loadTasks();
      }
    } catch (err) { console.error("Update failed"); }
  };

  // --- Search & Filter Logic ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      (t.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'All' || t.status === filterStatus)
    );
  }, [tasks, searchQuery, filterStatus]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
      'Matched': 'bg-purple-50 text-purple-700 border-purple-200',
      'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
      'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status] || 'bg-slate-50'}`}>{status}</span>;
  };

  const formatName = (userField: TaskUser | string | null, fallbackStr: string) => {
    if (!userField) return fallbackStr;
    if (typeof userField === 'object' && userField.name) return userField.name;
    return `User ID: ${userField}`; 
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none">
      
      {/* UPGRADE 1: Added Create Task Button to the Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Operational Log</h2>
          <p className="text-slate-500 text-sm font-medium italic">VolunMatch Master Records</p>
        </div>
        
        {/* Note: Swap window.location with React Router's useNavigate or Next's useRouter if preferred */}
        <button 
          onClick={() => navigate('/operations/create')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-5 w-5" />
          Create Task
        </button>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <div className="p-4 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" placeholder="Search tasks..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 outline-none"
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Matched">Matched</option>
            <option value="In Progress">In Progress</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Incident Title</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                  <td 
                    className="px-6 py-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 underline-offset-4 hover:underline"
                    onClick={() => setSelectedTask(task)}
                  >
                    {task.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-black ${task.severity >= 4 ? 'text-red-600' : 'text-slate-500'}`}>Lvl {task.severity}</span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === task._id ? null : task._id)}
                      className="p-2 hover:bg-slate-200 rounded-full transition-colors inline-block"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </button>

                    {activeMenuId === task._id && (
                      <div className="absolute right-6 top-12 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                        <button 
                          onClick={() => {
                            setActionTask(task);
                            setEditForm({
                              title: task.title,
                              category: task.category,
                              severity: task.severity,
                              locationDescription: task.locationDescription,
                              requiredSkills: task.requiredSkills.join(', ')
                            });
                            setIsEditModalOpen(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit className="h-3.5 w-3.5" /> Update Manually
                        </button>
                        <button 
                          onClick={() => {
                            setActionTask(task);
                            setIsCancelModalOpen(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Cancel Task
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- FULL IMMERSIVE TASK DOSSIER --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300 text-left">
            
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-slate-50 to-white">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-[0.2em]">
                    Incident Archive
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono italic">
                    UID: {selectedTask._id}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedTask.title}
                </h3>
                <div className="flex items-center gap-4 mt-3">
                  {getStatusBadge(selectedTask.status)}
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className={`h-4 w-4 ${selectedTask.severity >= 4 ? 'text-red-500' : 'text-amber-500'}`} />
                    Severity Level {selectedTask.severity}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 shadow-sm hover:shadow-inner"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {/* UPGRADE 2: Made the Completion/Cancellation Note visible right at the top if it exists */}
              {(selectedTask.status === 'Cancelled' || selectedTask.status === 'Completed') && (
                <section className="animate-in slide-in-from-top-4 duration-500">
                   <div className={`p-6 rounded-[2rem] border ${selectedTask.status === 'Cancelled' ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${selectedTask.status === 'Cancelled' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <h4 className={`text-sm font-black uppercase tracking-widest ${selectedTask.status === 'Cancelled' ? 'text-red-900' : 'text-emerald-900'}`}>
                          Final Resolution Summary
                        </h4>
                      </div>
                      <p className="text-base font-bold text-slate-800 leading-relaxed pl-12">
                        {selectedTask.completionNote || "Administrative closure with no formal notes recorded."}
                      </p>
                   </div>
                </section>
              )}

              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Primary Field Intelligence
                </h4>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-slate-50 border border-slate-100 p-8 rounded-3xl text-lg font-medium text-slate-700 leading-relaxed italic shadow-inner">
                    "{selectedTask.rawReportText}"
                  </div>
                </div>
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Officer</p>
                      <p className="text-base font-bold text-slate-900 truncate max-w-[250px]">
                        {formatName(selectedTask.reportedBy, "Standard Network User")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Assignee</p>
                      <p className="text-base font-bold text-slate-900 truncate max-w-[250px]">
                        {formatName(selectedTask.assignedVolunteer, "Awaiting Volunteer Match")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Wrench className="h-5 w-5 text-blue-400" />
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-300">Technical Requirements</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.requiredSkills && selectedTask.requiredSkills.length > 0 ? (
                        selectedTask.requiredSkills.map(skill => (
                          <span key={skill} className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-sm">No specialized skills mandated.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 text-slate-400">
                       <MapPin className="h-5 w-5" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Operational Zone</h4>
                     </div>
                     <p className="text-sm font-bold text-slate-800 leading-tight">
                       {selectedTask.locationDescription}
                     </p>
                   </div>
                   {selectedTask.location && selectedTask.location.coordinates && (
                     <div className="mt-8 pt-4 border-t border-slate-50">
                       <div className="flex flex-col gap-1 text-[10px] font-mono font-bold text-slate-400">
                         <span>GPS COORDINATES</span>
                         <span className="text-blue-500">
                           {selectedTask.location.coordinates[1].toFixed(4)}, {selectedTask.location.coordinates[0].toFixed(4)}
                         </span>
                       </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="h-3.5 w-3.5" /> Logged: {new Date(selectedTask.createdAt).toLocaleString()}
                  </div>
                  <div className="h-3 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Last Handled: {new Date(selectedTask.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- CANCEL MODAL --- */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-red-100">
            <h3 className="text-xl font-black text-slate-900 mb-2">Cancel Incident</h3>
            <p className="text-sm text-slate-500 mb-6">Please provide an operational reason for cancelling this task.</p>
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none mb-6"
              placeholder="e.g. False alarm reported by field staff..."
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Go Back</button>
              <button onClick={handleCancelSubmit} className="flex-1 py-3 text-sm font-bold bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">Confirm Cancellation</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MANUAL UPDATE MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md text-left">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">Update Task Parameters</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Incident Title</label>
                <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold mt-1" 
                  value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
                  
                  {/* UPGRADE 3: Pulled in all 11 correct schema categories */}
                  <select className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold mt-1"
                    value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})}>
                    <option value="" disabled>Select Category...</option>
                    {TASK_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Severity (1-5)</label>
                  <input type="number" min="1" max="5" className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold mt-1"
                    value={editForm.severity} onChange={(e) => setEditForm({...editForm, severity: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Location Description</label>
                <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold mt-1"
                  value={editForm.locationDescription} onChange={(e) => setEditForm({...editForm, locationDescription: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Required Skills (Comma separated)</label>
                <input type="text" className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold mt-1"
                  value={editForm.requiredSkills} onChange={(e) => setEditForm({...editForm, requiredSkills: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Discard</button>
              <button onClick={handleUpdateSubmit} className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}