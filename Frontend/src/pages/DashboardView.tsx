import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, MapPin, AlertCircle, Clock, Activity, Users, CheckCircle2, Filter, ArrowUpDown } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import TaskMap from './TaskMap';

import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts"

interface DashboardData {
  stats: {
    tasks: {
      pending: number;
      inProgress: number;
      completed: number;
      matched: number;
      cancelled: number;
      criticalActive: number;
      total: number;
    };
    activeCategories: Record<string, number>;
    personnel: {
      volunteersOnline: number;
      volunteersOffline: number;
      totalVolunteers: number;
      totalWorkers: number;
    };
  };
  taskList: any[];
}

const TASK_COLORS = {
  Pending: '#F59E0B',    
  InProgress: '#0284C7', 
  Completed: '#059669',  
  Matched: '#7C3AED',    
  Cancelled: '#DC2626'   
};

const VOLUNTEER_COLORS = {
  Online: '#059669', 
  Offline: '#CBD5E1' 
};

export default function DashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortSeverity, setSortSeverity] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const loadData = async () => {
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!authToken) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/v1/admins/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Unauthorized access to dashboard.");
        }
      } catch (err) {
        setError("Connection failed. Ensure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Multi-Filter Logic
  const filteredAndSortedTasks = useMemo(() => {
    if (!data?.taskList) return [];

    let result = [...data.taskList];

    if (filterCategory !== 'All') {
      result = result.filter(task => task.category === filterCategory);
    }

    if (filterStatus !== 'All') {
      result = result.filter(task => task.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortSeverity === 'desc') return b.severity - a.severity; 
      return a.severity - b.severity; 
    });

    return result;
  }, [data, filterCategory, filterStatus, sortSeverity]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
        <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">Loading Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200 max-w-lg mx-auto mt-10 shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 mb-3 text-red-500" />
        <p className="font-semibold text-lg">{error}</p>
      </div>
    );
  }

  const { stats } = data!;

  const taskChartData = [
    { name: 'Pending', value: stats.tasks.pending, color: TASK_COLORS.Pending },
    { name: 'In Progress', value: stats.tasks.inProgress, color: TASK_COLORS.InProgress },
    { name: 'Completed', value: stats.tasks.completed, color: TASK_COLORS.Completed },
    { name: 'Matched', value: stats.tasks.matched, color: TASK_COLORS.Matched },
    { name: 'Cancelled', value: stats.tasks.cancelled, color: TASK_COLORS.Cancelled }
  ].filter(item => item.value > 0); 

  const categoryChartData = Object.entries(stats.activeCategories)
    .map(([name, count]: [string, any]) => ({ name, count: Number(count) }))
    .sort((a, b) => b.count - a.count); 

  const volunteerChartData = [
    { name: 'Available', value: stats.personnel.volunteersOnline, color: VOLUNTEER_COLORS.Online },
    { name: 'Offline', value: stats.personnel.volunteersOffline, color: VOLUNTEER_COLORS.Offline }
  ];

  const biTooltipStyle = {
    backgroundColor: '#0F172A', 
    color: '#F8FAFC',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    fontSize: '12px',
    fontWeight: 500,
    padding: '12px'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="bg-amber-100 text-amber-800 border-amber-200 border px-2.5 py-1 rounded-md text-xs font-bold uppercase">Pending</span>;
      case 'In Progress': return <span className="bg-sky-100 text-sky-800 border-sky-200 border px-2.5 py-1 rounded-md text-xs font-bold uppercase">In Progress</span>;
      case 'Matched': return <span className="bg-purple-100 text-purple-800 border-purple-200 border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Matched</span>; // Add this line
      case 'Completed': return <span className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-2.5 py-1 rounded-md text-xs font-bold uppercase">Completed</span>;
      case 'Cancelled': return <span className="bg-red-100 text-red-800 border-red-200 border px-2.5 py-1 rounded-md text-xs font-bold uppercase">Cancelled</span>;
      default: return <span className="bg-slate-100 text-slate-800 border-slate-200 border px-2.5 py-1 rounded-md text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen pb-10 rounded-xl p-2 md:p-6">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Executive Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Global Response Network</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Synced</p>
          <p className="text-sm font-medium text-slate-700">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Active Personnel</p>
                <p className="text-3xl font-black text-slate-900">{stats.personnel.volunteersOnline}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium">Out of {stats.personnel.totalVolunteers} total registered</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Operations</p>
                <p className="text-3xl font-black text-slate-900">{stats.tasks.total}</p>
              </div>
              <div className="p-2 bg-sky-50 rounded-lg">
                <Activity className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium">{stats.tasks.pending} pending assignment</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Critical Incidents</p>
                <p className="text-3xl font-black text-red-600">{stats.tasks.criticalActive}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-500/80 mt-4 font-medium">Require immediate response</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-800"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">System Status</p>
                <p className="text-xl font-black text-slate-900 mt-2">Operational</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-slate-700" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-medium">Port 8000 Linked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-sm border-slate-200 flex flex-col">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskChartData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={biTooltipStyle} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{stats.tasks.total}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
              {taskChartData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                  <span className="ml-auto font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200 flex flex-col md:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">Volume by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            <div className="h-[260px] w-full">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 500 }} dy={10} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 500 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={biTooltipStyle} />
                    <Bar dataKey="count" fill="#0284C7" radius={[4, 4, 0, 0]} name="Active Incidents" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                  No categorical data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <TaskMap />
      </div>

      {/* BOTTOM SECTION: FILTERABLE DATA TABLE */}
      <Card className="bg-white shadow-sm border-slate-200">
        
        <div className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Active Incident Log ({filteredAndSortedTasks.length})
            </CardTitle>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Filter className="h-4 w-4" /> Filters:
            </div>
            
            <select 
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-sky-500 focus:border-sky-500 block px-3 py-1.5 shadow-sm font-medium cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {Object.keys(stats.activeCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-sky-500 focus:border-sky-500 block px-3 py-1.5 shadow-sm font-medium cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Matched">Matched</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <ArrowUpDown className="h-4 w-4" /> Sort By:
            </div>
            <select 
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-sky-500 focus:border-sky-500 block px-3 py-1.5 shadow-sm font-medium cursor-pointer"
              value={sortSeverity}
              onChange={(e) => setSortSeverity(e.target.value as 'desc' | 'asc')}
            >
              <option value="desc">Severity (High to Low)</option>
              <option value="asc">Severity (Low to High)</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider w-24">Severity</th>
                  <th className="px-6 py-4 font-semibold tracking-wider w-32">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Incident Details</th>
                  <th className="px-6 py-4 font-semibold tracking-wider w-40">Category</th>
                  <th className="px-6 py-4 font-semibold tracking-wider w-48">Location</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right w-40">Time Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${task.severity >= 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-bold text-slate-700">Lvl {task.severity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(task.status)}
                    </td>
                    
                    {/* NEW: Hover-Reveal Details Column */}
                    <td className="px-6 py-4 max-w-[250px] relative">
                      <p className="font-bold text-slate-900 truncate">{task.title}</p>
                      
                      <div className="group/tooltip inline-block w-full">
                        {/* The Truncated Text (with a dashed underline to indicate hoverability) */}
                        <p className="text-slate-500 text-xs mt-1 truncate cursor-help underline decoration-slate-300 decoration-dashed underline-offset-4 hover:text-slate-700 transition-colors">
                          {task.rawReportText}
                        </p>
                        
                        {/* The Custom Tailwind Hover Card */}
                        <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-all duration-200 absolute z-50 left-6 top-[80%] mt-2 w-72 bg-slate-900 text-slate-50 text-xs leading-relaxed rounded-lg shadow-2xl border border-slate-700 p-3 whitespace-normal break-words">
                          {/* Tooltip Arrow pointing up */}
                          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                          <span className="relative z-10 font-medium">{task.rawReportText}</span>
                        </div>
                      </div>
                    </td>
                    {/* End Hover-Reveal Details */}

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px] block" title={task.locationDescription}>
                          {task.locationDescription}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-medium whitespace-nowrap">
                      {new Date(task.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {filteredAndSortedTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-slate-500 font-medium text-base mb-1">No tasks match your filters.</p>
                      <button 
                        onClick={() => { setFilterCategory('All'); setFilterStatus('All'); }}
                        className="text-sky-600 font-semibold hover:underline text-sm"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}