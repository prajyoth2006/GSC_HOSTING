import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, MapPin, AlertCircle, Clock, Activity, Users, CheckCircle2, Filter, ArrowUpDown } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import TaskMap from './TaskMap';
import { BASE_URL } from '../../utils/constants.js';

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
        const response = await fetch(`${BASE_URL}/admins/dashboard-stats`, {
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
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-sky-500/20 animate-pulse"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-sky-600 relative z-10"></div>
        </div>
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">Initializing Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-100 max-w-lg mx-auto mt-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h3>
        <p className="font-medium text-slate-500">{error}</p>
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
    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
    backdropFilter: 'blur(8px)',
    color: '#F8FAFC',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontSize: '13px',
    fontWeight: 500,
    padding: '12px 16px'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">Pending</span>;
      case 'In Progress': return <span className="inline-flex items-center bg-sky-50 text-sky-700 border border-sky-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">In Progress</span>;
      case 'Matched': return <span className="inline-flex items-center bg-purple-50 text-purple-700 border border-purple-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">Matched</span>;
      case 'Completed': return <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">Completed</span>;
      case 'Cancelled': return <span className="inline-flex items-center bg-red-50 text-red-700 border border-red-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">Cancelled</span>;
      default: return <span className="inline-flex items-center bg-slate-50 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 bg-slate-50/50 min-h-screen pb-12 rounded-2xl p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Executive Dashboard
          </h2>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Global Response Network</p>
          </div>
        </div>
        <div className="text-left md:text-right bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Last Synced</p>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden bg-white shadow-sm border-slate-200/60 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-emerald-500 rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Active Personnel</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.personnel.volunteersOnline}</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-500">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mr-2 font-bold">{stats.personnel.totalVolunteers}</span>
              Total Registered
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white shadow-sm border-slate-200/60 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-sky-500 rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Total Operations</p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.tasks.total}</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl border border-sky-100">
                <Activity className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-500">
              <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-md mr-2 font-bold">{stats.tasks.pending}</span>
              Pending Assignment
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white shadow-sm border-slate-200/60 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-red-500 rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Critical Incidents</p>
                <p className="text-4xl font-black text-red-600 tracking-tight">{stats.tasks.criticalActive}</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-100">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-red-500/80">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Require immediate response
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white shadow-sm border-slate-200/60 hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-slate-800 rounded-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">System Status</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight mt-2">Operational</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-200/50 rounded-xl border border-slate-200">
                <CheckCircle2 className="h-5 w-5 text-slate-700" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-500">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md mr-2 font-bold">Port 8000</span>
              Linked & Active
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="bg-white shadow-sm border-slate-200/60 flex flex-col rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskChartData}
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={biTooltipStyle} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-800 tracking-tight">{stats.tasks.total}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              {taskChartData.map(item => (
                <div key={item.name} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-semibold text-xs">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-slate-200/60 flex flex-col md:col-span-2 rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">Volume by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-8 px-6 pb-6">
            <div className="h-[280px] w-full">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} dy={12} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={biTooltipStyle} />
                    <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} name="Active Incidents" barSize={48}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0284C7' : '#38BDF8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Activity className="h-8 w-8 text-slate-300 mb-2" />
                  No categorical data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <div className="w-full rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white p-2">
        <div className="rounded-lg overflow-hidden">
          <TaskMap />
        </div>
      </div>

      {/* BOTTOM SECTION: FILTERABLE DATA TABLE */}
      <Card className="bg-white shadow-sm border-slate-200/60 rounded-xl overflow-hidden">
        
        <div className="border-b border-slate-200/80 bg-slate-50/80 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <CardTitle className="text-[13px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-500"></div>
              Active Incident Log 
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-xs ml-2">{filteredAndSortedTasks.length}</span>
            </CardTitle>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
              <Filter className="h-4 w-4 text-sky-500" /> Filters
            </div>
            
            <select 
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 block px-4 py-2 font-semibold cursor-pointer hover:border-slate-300 transition-colors outline-none min-w-[160px]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {Object.keys(stats.activeCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 block px-4 py-2 font-semibold cursor-pointer hover:border-slate-300 transition-colors outline-none min-w-[160px]"
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

            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <ArrowUpDown className="h-4 w-4 text-slate-400" /> Sort
            </div>
            <select 
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 block px-4 py-2 font-semibold cursor-pointer hover:border-slate-300 transition-colors outline-none min-w-[200px]"
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
              <thead className="text-[11px] text-slate-500 uppercase bg-white border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-5 font-bold tracking-widest w-28">Severity</th>
                  <th className="px-6 py-5 font-bold tracking-widest w-36">Status</th>
                  <th className="px-6 py-5 font-bold tracking-widest">Incident Details</th>
                  <th className="px-6 py-5 font-bold tracking-widest w-44">Category</th>
                  <th className="px-6 py-5 font-bold tracking-widest w-56">Location</th>
                  <th className="px-6 py-5 font-bold tracking-widest text-right w-44">Time Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAndSortedTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/80 hover:shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] transition-all duration-200 group relative z-0 hover:z-10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${task.severity >= 5 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-amber-500'}`} />
                        <span className="font-extrabold text-slate-700">Lvl {task.severity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(task.status)}
                    </td>
                    
                    {/* Hover-Reveal Details Column */}
                    <td className="px-6 py-4 max-w-[280px] relative">
                      <p className="font-bold text-slate-900 truncate text-[13px]">{task.title}</p>
                      
                      <div className="group/tooltip inline-block w-full">
                        <p className="text-slate-500 text-[12px] mt-1 truncate cursor-help underline decoration-slate-300 decoration-dashed underline-offset-4 hover:text-slate-800 transition-colors font-medium">
                          {task.rawReportText}
                        </p>
                        
                        {/* Custom Tailwind Hover Card (Glassmorphism) */}
                        <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-all duration-300 absolute z-50 left-6 top-[80%] mt-2 w-80 bg-slate-900/95 backdrop-blur-md text-slate-50 text-[13px] leading-relaxed rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-700/50 p-4 whitespace-normal break-words">
                          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900/95 border-t border-l border-slate-700/50 rotate-45"></div>
                          <span className="relative z-10 font-medium">{task.rawReportText}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60 uppercase tracking-wider">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-md shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="truncate max-w-[160px] block text-[13px]" title={task.locationDescription}>
                          {task.locationDescription}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-semibold text-[12px] whitespace-nowrap">
                      {new Date(task.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {filteredAndSortedTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center bg-slate-50/50">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200/50 mb-3">
                        <Filter className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-bold text-sm mb-1">No incidents match your criteria</p>
                      <button 
                        onClick={() => { setFilterCategory('All'); setFilterStatus('All'); }}
                        className="text-sky-600 font-bold hover:text-sky-700 hover:underline text-xs tracking-wide uppercase mt-2 transition-colors"
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