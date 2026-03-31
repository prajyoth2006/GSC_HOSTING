import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// --------------------------------

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
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export default function TaskMap() {
  const [mapTasks, setMapTasks] = useState<MapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/v1/admins/map-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const json = await response.json();
        
        if (json.success) {
          setMapTasks(json.data);
        } else {
          setError(json.message || "Failed to load map data");
        }
      } catch (err) {
        setError("Could not connect to map server.");
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  // Set the default center of the map (e.g., New Delhi coordinates)
  const defaultCenter: [number, number] = [28.6139, 77.2090];

  return (
    <Card className="w-full h-[600px] flex flex-col shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 z-10">
        <CardTitle className="flex items-center text-lg text-slate-800">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Live Active Tasks ({mapTasks.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow relative bg-slate-100 h-full">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/90">
            <div className="text-red-600 flex items-center bg-red-50 px-4 py-2 rounded-lg border border-red-100">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <MapContainer 
            center={defaultCenter} 
            zoom={11} 
            className="w-full h-full z-0"
            scrollWheelZoom={true}
          >
            {/* The base map visuals from OpenStreetMap */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Loop through tasks and plot markers */}
            {mapTasks.map((task) => {
              // Extract coordinates. Remember: MongoDB is [lng, lat], Leaflet is [lat, lng]
              const lng = task.location.coordinates[0];
              const lat = task.location.coordinates[1];

              return (
                <Marker key={task._id} position={[lat, lng]}>
                  {/* The Popup is what shows when you click the marker */}
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px]">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900">{task.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider 
                          ${task.severity >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          Sev {task.severity}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 mb-2 border-b pb-2">
                        {task.locationDescription}
                      </p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {task.category}
                        </span>
                        
                        {/* Navigate to the A-to-Z details page */}
                        <button 
                          onClick={() => navigate(`/tasks/${task._id}`)}
                          className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Full Details <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </CardContent>
    </Card>
  );
}