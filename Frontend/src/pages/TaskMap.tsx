import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, ExternalLink, Layers, AlertTriangle, Navigation, Map } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Matches the exact backend payload from getActiveTasksForMap
interface MapTask {
  _id: string;
  title: string;
  rawReportText: string;
  locationDescription: string;
  category: string;
  severity: number;
  status: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] from MongoDB
  };
}

// Custom CSS-based marker generator based on severity
const createCustomIcon = (severity: number) => {
  let bgColor = 'bg-blue-500';
  
  if (severity >= 4) {
    bgColor = 'bg-red-500';
  } else if (severity === 3) {
    bgColor = 'bg-amber-500';
  } else if (severity <= 2) {
    bgColor = 'bg-emerald-500';
  }

  return L.divIcon({
    className: 'custom-marker-icon bg-transparent border-none',
    html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${bgColor} flex items-center justify-center transition-transform hover:scale-110">
             <div class="w-2 h-2 bg-white rounded-full"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

export default function TaskMap() {
  const [mapTasks, setMapTasks] = useState<MapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        // Ensure this URL matches your Express router exactly
        const response = await fetch('http://localhost:8000/api/v1/admins/map-data', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Catch server crashes (500s) or missing routes (404s)
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        
        if (json.success) {
          setMapTasks(json.data);
        } else {
          setError(json.message || "The server failed to return map data.");
        }
      } catch (err) {
        console.error("Map fetch error:", err);
        setError(err instanceof Error ? err.message : "Network error. Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  // Set your city's default center coordinates here [Latitude, Longitude]
  const defaultCenter: [number, number] = [28.6139, 77.2090]; 

  // Calculate stats dynamically for the floating dashboard
  const stats = useMemo(() => {
    return {
      total: mapTasks.length,
      critical: mapTasks.filter(t => t.severity >= 4).length,
      moderate: mapTasks.filter(t => t.severity === 3).length,
      low: mapTasks.filter(t => t.severity <= 2).length,
    };
  }, [mapTasks]);

  return (
    <Card className="w-full h-[700px] flex flex-col shadow-lg border-slate-200 overflow-hidden relative">
      <CardHeader className="bg-white border-b border-slate-100 pb-4 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center text-xl text-slate-800">
            <MapPin className="h-6 w-6 mr-2 text-blue-600" />
            Live Active Tasks
          </CardTitle>
          <CardDescription className="mt-1">
            Real-time geographical overview of reported issues
          </CardDescription>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1">
            <Layers className="w-3 h-3 mr-1" /> {stats.total} Total
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
            <AlertTriangle className="w-3 h-3 mr-1" /> {stats.critical} Critical
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow relative bg-slate-100 h-full">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing live data from server...</p>
          </div>
        )}
        
        {/* Error Overlay */}
        {error && !loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="text-red-600 flex flex-col items-center bg-white px-8 py-6 rounded-xl border border-red-100 shadow-xl max-w-md text-center">
              <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
              <h3 className="font-bold text-xl mb-2 text-slate-900">System Error</h3>
              <p className="text-sm text-slate-600 mb-6">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Reload Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Empty State Overlay (If API connects but returns 0 tasks) */}
        {!loading && !error && mapTasks.length === 0 && (
           <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
             <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-full shadow-lg border border-slate-200 flex items-center text-slate-600 pointer-events-auto">
               <Map className="w-5 h-5 mr-2 text-slate-400" />
               <span className="font-medium">No active tasks to display right now.</span>
             </div>
           </div>
        )}

        {/* The Map */}
        {!error && (
          <div className="w-full h-full relative">
            
            {/* Floating Stats Panel (Desktop Only) */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none hidden md:flex">
              <Card className="shadow-xl border-none bg-white/95 backdrop-blur-md pointer-events-auto w-48">
                <CardContent className="p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Severity Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-500/40"></div>
                        <span className="text-sm text-slate-600 font-medium">Critical (4-5)</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{stats.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2 shadow-sm shadow-amber-500/40"></div>
                        <span className="text-sm text-slate-600 font-medium">Moderate (3)</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{stats.moderate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/40"></div>
                        <span className="text-sm text-slate-600 font-medium">Low (1-2)</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{stats.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <MapContainer 
              center={defaultCenter} 
              zoom={11} 
              className="w-full h-full z-0"
              scrollWheelZoom={true}
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              
              <LayersControl position="topleft">
                <LayersControl.BaseLayer checked name="Modern Light">
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Standard Map">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Dark Mode">
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {mapTasks.map((task) => {
                // MongoDB gives [Longitude, Latitude], Leaflet needs [Latitude, Longitude]
                const lng = task.location.coordinates[0];
                const lat = task.location.coordinates[1];

                return (
                  <Marker 
                    key={task._id} 
                    position={[lat, lng]}
                    icon={createCustomIcon(task.severity)}
                  >
                    <Popup className="custom-popup" closeButton={false}>
                      <div className="p-0 min-w-[240px] font-sans">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-slate-900 text-base leading-tight pr-2">{task.title}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0
                              ${task.severity >= 4 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 
                                task.severity === 3 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 
                                'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                          >
                            Sev {task.severity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-start gap-2 mb-3 bg-slate-50 p-2 rounded-md border border-slate-100">
                          <Navigation className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {task.locationDescription}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline" className="text-[10px] text-slate-500 bg-white">
                            {task.category}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] text-slate-500 bg-white">
                            {task.status}
                          </Badge>
                        </div>
                        
                        <Button 
                          onClick={() => navigate(`/tasks/${task._id}`)}
                          className="w-full flex items-center justify-center text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors h-8"
                          size="sm"
                        >
                          View Full Details <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}