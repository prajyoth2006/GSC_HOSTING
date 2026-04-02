import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, MapPin, Calendar, Clock, User, Phone, 
  AlertTriangle, CheckCircle2, ShieldAlert, Wrench, FileText 
} from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js';

// Define the shape of our fully populated Task data
interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  skills?: string[];
  isAvailable?: boolean;
}

interface FullTask {
  _id: string;
  title: string;
  rawReportText: string;
  locationDescription: string;
  category: string;
  severity: number;
  status: string;
  requiredSkills: string[];
  location: {
    type: string;
    coordinates: [number, number];
  };
  reportedBy: PopulatedUser;
  assignedVolunteer: PopulatedUser | null;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/admins/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const json = await response.json();
        
        if (json.success) {
          setTask(json.data);
        } else {
          setError(json.message || "Failed to load task details");
        }
      } catch (err) {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  // Helper functions for UI styling
  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'bg-red-100 text-red-700 border-red-200';
    if (sev === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-slate-200 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading full task dossier...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl border border-red-100 inline-block">
          <ShieldAlert className="mx-auto h-10 w-10 mb-3" />
          <h2 className="text-xl font-bold mb-2">Error Loading Task</h2>
          <p>{error || "Task not found"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 bg-white px-4 py-2 rounded-md shadow-sm border font-medium text-slate-700 hover:bg-slate-50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      
      {/* Top Navigation */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getSeverityColor(task.severity)}`}>
              Severity {task.severity}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
              {task.category}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{task.title}</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center">
            <Clock className="h-4 w-4 mr-1.5" /> 
            Reported on {new Date(task.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info Column (Takes up 2/3 of the screen) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Incident Report Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-slate-500" /> Original Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-slate-700 whitespace-pre-wrap leading-relaxed">
              {task.rawReportText}
            </CardContent>
          </Card>

          {/* Location Details Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="font-semibold text-lg text-slate-900 mb-2">{task.locationDescription}</p>
              <div className="flex gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-md border inline-flex">
                <span><strong>Lat:</strong> {task.location.coordinates[1].toFixed(5)}</span>
                <span><strong>Lng:</strong> {task.location.coordinates[0].toFixed(5)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Required Skills Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="flex items-center text-lg">
                <Wrench className="h-5 w-5 mr-2 text-slate-500" /> Required Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {task.requiredSkills && task.requiredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No specific skills required for this task.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Column (Takes up 1/3 of the screen) */}
        <div className="space-y-6">
          
          {/* Assigned Volunteer Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className={`p-1 ${task.assignedVolunteer ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Assigned Responder
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {task.assignedVolunteer ? (
                <div>
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                      {task.assignedVolunteer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{task.assignedVolunteer.name}</p>
                      <p className="text-xs text-slate-500">{task.assignedVolunteer.email}</p>
                    </div>
                  </div>
                  {task.assignedVolunteer.phone && (
                    <p className="text-sm flex items-center text-slate-600 mb-2">
                      <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" /> {task.assignedVolunteer.phone}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
                  <p className="text-slate-900 font-semibold">Unassigned</p>
                  <p className="text-sm text-slate-500 mt-1">This task is waiting for a volunteer.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reported By Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Reported By
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 mt-2 mb-3">
                <div className="h-10 w-10 bg-slate-100 text-slate-600 border rounded-full flex items-center justify-center font-bold text-lg">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{task.reportedBy.name}</p>
                  <p className="text-xs text-slate-500">{task.reportedBy.role}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 truncate">{task.reportedBy.email}</p>
              {task.reportedBy.phone && (
                <p className="text-sm text-slate-600 mt-1 flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" /> {task.reportedBy.phone}
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}