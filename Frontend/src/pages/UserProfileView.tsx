import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Mail, Shield, Activity, HardHat, 
  Calendar, MapPin, Filter, ArrowUpDown, Clock, CheckCircle2 
} from 'lucide-react';

// --- Interfaces based on your real API response ---
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  createdAt: string;
  isAvailable?: boolean;
}

interface UserTask {
  _id: string;
  title: string;
  rawReportText: string;
  category: string;
  severity: number;
  status: string;
  locationDescription: string;
  createdAt: string;
}

interface UserHistoryCounts {
  totalReported?: number;
  totalAssigned?: number;
  totalCompleted?: number;
  [key: string]: number | undefined;
}

export default function UserProfileView() {
  const { userId } = useParams<{ userId: string }>();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [counts, setCounts] = useState<UserHistoryCounts>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States for the history table
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'severity'>('newest');

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!authToken) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/v1/admins/users/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        const json = await response.json();

        if (json.success) {
          setProfile(json.data.profile);
          setTasks(json.data.history?.tasks || []);
          setCounts(json.data.history?.counts || {});
        } else {
          setError(json.message || "Failed to load user profile.");
        }
      } catch (err) {
        setError("Could not connect to the VolunMatch server.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserDetails();
  }, [userId]);

  // --- Filtering & Sorting Logic ---
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }
    if (filterStatus !== 'All') {
      result = result.filter(t => t.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortOrder === 'severity') return b.severity - a.severity;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [tasks, filterCategory, filterStatus, sortOrder]);

  // Extract unique categories and statuses for dropdowns
  const uniqueCategories = Array.from(new Set(tasks.map(t => t.category)));
  const uniqueStatuses = Array.from(new Set(tasks.map(t => t.status)));

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Worker': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Volunteer': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="bg-amber-100 text-amber-800 border-amber-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Pending</span>;
      case 'In Progress': return <span className="bg-sky-100 text-sky-800 border-sky-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">In Progress</span>;
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Completed</span>;
      case 'Cancelled': return <span className="bg-red-100 text-red-800 border-red-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Cancelled</span>;
      default: return <span className="bg-slate-100 text-slate-800 border-slate-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Fetching Profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 space-y-4 text-center">
        <div className="p-8 bg-red-50 border border-red-100 rounded-xl text-red-600">
          <Shield className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-bold">{error || "User Not Found"}</h2>
          <p className="text-sm mt-2 text-red-500/80">The requested profile could not be loaded.</p>
        </div>
        <Link to="/directory" className="inline-block text-blue-600 font-semibold hover:underline">
          &larr; Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* --- HEADER --- */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <Link to="/directory" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Personnel Dossier</h2>
          <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase mt-1">Detailed Operational View</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN: PROFILE CARD --- */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-white shadow-sm border-slate-200 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900"></div>
            <CardContent className="px-6 pb-6 pt-0 relative">
              <div className="flex justify-between items-end mb-4">
                <div className={`-mt-12 h-24 w-24 rounded-full border-4 border-white flex items-center justify-center text-3xl font-black shadow-md ${getRoleBadge(profile.role)}`}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border mb-2 ${getRoleBadge(profile.role)}`}>
                  {profile.role}
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Volunteer Specific Info */}
              {profile.role === 'Volunteer' && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Availability</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${profile.isAvailable !== false ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={`text-sm font-bold ${profile.isAvailable !== false ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {profile.isAvailable !== false ? 'Ready for Deployment' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((skill, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-xs font-semibold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No skills listed</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">Historical Impact</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              {Object.entries(counts).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 font-medium capitalize text-sm">
                    {key.includes('Report') ? <Shield className="h-4 w-4 text-blue-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <span className="text-lg font-black text-slate-900">{val || 0}</span>
                </div>
              ))}
              {Object.keys(counts).length === 0 && (
                <div className="text-center text-sm text-slate-500 italic py-2">No historical data available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: TASK HISTORY TABLE --- */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white shadow-sm border-slate-200 h-full flex flex-col">
            
            {/* Header & Filters */}
            <div className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl p-4 md:p-6">
              <CardTitle className="text-lg font-bold text-slate-800 mb-4">Associated Operations</CardTitle>
              
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Filter className="h-4 w-4" /> Filters:
                </div>
                
                <select 
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 font-medium cursor-pointer"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select 
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 font-medium cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>

                <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <ArrowUpDown className="h-4 w-4" /> Sort:
                </div>
                <select 
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5 font-medium cursor-pointer"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="severity">Highest Severity</option>
                </select>
              </div>
            </div>

            {/* Table Area */}
            <CardContent className="p-0 flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-bold w-16">Lvl</th>
                      <th className="px-5 py-3 font-bold w-24">Status</th>
                      <th className="px-5 py-3 font-bold">Incident Details</th>
                      <th className="px-5 py-3 font-bold w-32">Location</th>
                      <th className="px-5 py-3 font-bold w-32 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <tr key={task._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-3">
                          <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${task.severity >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {task.severity}
                          </div>
                        </td>
                        <td className="px-5 py-3">{getStatusBadge(task.status)}</td>
                        
                        {/* Hover Tooltip for Text */}
                        <td className="px-5 py-3 max-w-[200px] relative">
                          <p className="font-bold text-slate-900 truncate">{task.title}</p>
                          <div className="group/tooltip inline-block w-full">
                            <p className="text-slate-500 text-xs mt-0.5 truncate cursor-help underline decoration-slate-300 decoration-dashed underline-offset-2 hover:text-slate-700">
                              {task.rawReportText}
                            </p>
                            <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-all duration-200 absolute z-50 left-5 top-[80%] mt-2 w-64 bg-slate-900 text-slate-50 text-xs leading-relaxed rounded-lg shadow-xl border border-slate-700 p-3 whitespace-normal break-words">
                              <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                              <span className="relative z-10 font-medium">{task.rawReportText}</span>
                            </div>
                          </div>
                          <span className="inline-block mt-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                            {task.category}
                          </span>
                        </td>
                        
                        <td className="px-5 py-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]" title={task.locationDescription}>
                              {task.locationDescription}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-500 font-medium whitespace-nowrap text-xs">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No operations match your current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}