import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, MapPin, ClipboardList, Save, 
  ArrowLeft, Crosshair, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js';

// Exact categories matching your backend schema
const TASK_CATEGORIES = [
  'Medical', 'Rescue', 'Food & Water', 'Shelter', 
  'Sanitation', 'Labor', 'Transport', 'Supplies', 
  'Animal Rescue', 'Infrastructure', 'Other'
];

export default function CreateTaskByAdmin() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: 1,
    locationDescription: '',
    longitude: '',
    latitude: '',
    rawReportText: '',
    requiredSkills: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing again
    if (error) setError(null);
  };

  // --- HTML5 Geolocation API ---
  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (err) => {
          setError("Could not fetch location. Please ensure location permissions are enabled.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Strictly format data for backend matching your required JSON structure
    const payload = {
      title: formData.title,
      rawReportText: formData.rawReportText,
      category: formData.category,
      severity: Number(formData.severity),
      locationDescription: formData.locationDescription,
      longitude: Number(formData.longitude),
      latitude: Number(formData.latitude),
      requiredSkills: formData.requiredSkills
        ? formData.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean)
        : []
    };

    try {
      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/admins/create-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create task");
      }

      setSuccess(true);
      
      // Auto-redirect to operations/dashboard after success
      setTimeout(() => {
        navigate('/operations'); 
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate('/operations')}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Emergency Task</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manually log a new crisis into the system.</p>
          </div>
        </div>

        {/* --- Status Messages --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Submission Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-900">Task created successfully! Redirecting to dashboard...</p>
          </div>
        )}

        {/* --- Form Container --- */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
          
          <div className="p-8 space-y-8">
            {/* Section 1: Primary Incident Details */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Primary Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Incident Title *</label>
                  <input 
                    type="text" name="title" required
                    placeholder="e.g. Flooded Road Blocking Evacuation"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.title} onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Category *</label>
                  <select 
                    name="category" required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    value={formData.category} onChange={handleChange}
                  >
                    <option value="" disabled>Select Category...</option>
                    {TASK_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Severity Level (1-5) *</label>
                  <select 
                    name="severity" required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer"
                    value={formData.severity} onChange={handleChange}
                  >
                    <option value="1">Level 1 - Minor / Non-Urgent</option>
                    <option value="2">Level 2 - Low Priority</option>
                    <option value="3">Level 3 - Moderate Priority</option>
                    <option value="4">Level 4 - High Priority</option>
                    <option value="5">Level 5 - Critical / Life-Threatening</option>
                  </select>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: Spatial Data */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Spatial Data
                </h3>
                <button 
                  type="button" 
                  onClick={handleGetLocation}
                  className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Crosshair className="h-3 w-3" /> Fetch Current GPS
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Location Description *</label>
                  <input 
                    type="text" name="locationDescription" required
                    placeholder="e.g. Main Street near the River Bridge"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.locationDescription} onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Longitude *</label>
                  <input 
                    type="number" step="any" name="longitude" required placeholder="e.g. 77.1025"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.longitude} onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Latitude *</label>
                  <input 
                    type="number" step="any" name="latitude" required placeholder="e.g. 28.7041"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.latitude} onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3: Detailed Intelligence */}
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Operational Intelligence
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Raw Report Text (Full Context) *</label>
                  <textarea 
                    name="rawReportText" required rows={4}
                    placeholder="e.g. Main street is completely flooded, need high-clearance vehicles to move people out."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
                    value={formData.rawReportText} onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Required Skills (Optional)</label>
                  <input 
                    type="text" name="requiredSkills"
                    placeholder="e.g. Driving, Swift Water Rescue (Comma separated)"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.requiredSkills} onChange={handleChange}
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Separate multiple skills with commas.</p>
                </div>
              </div>
            </section>
          </div>

          {/* --- Footer / Submit --- */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || success}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
            >
              {isSubmitting ? (
                <>Creating Task...</>
              ) : (
                <>
                  <Save className="h-5 w-5" /> Create Task
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}