import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { Crosshair, ExternalLink, Plus, Minus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Custom Icons ---
const incidentIcon = L.divIcon({
  className: 'custom-incident-icon',
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-red-500 rounded-full animate-ping opacity-25"></div>
          <div class="relative w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
         </div>`,
  iconSize: [24, 24],
});

const volunteerIcon = L.divIcon({
  className: 'custom-volunteer-icon',
  html: `<div class="w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md hover:scale-150 transition-transform"></div>`,
  iconSize: [14, 14],
});

const TacticalMap = ({ taskLocation, candidates, searchRadius, onSelectVolunteer }) => {
  const [mapInstance, setMapInstance] = useState(null);

  const center = (taskLocation && taskLocation.coordinates) 
    ? [taskLocation.coordinates[1], taskLocation.coordinates[0]] 
    : null;

  const handleGPSClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!mapInstance || !center) return;

    if (searchRadius && Number(searchRadius) > 0) {
      const radiusInMeters = Number(searchRadius) * 1000;
      const centerLatLng = L.latLng(center[0], center[1]);
      const mathematicalBounds = centerLatLng.toBounds(radiusInMeters * 2);
      
      mapInstance.fitBounds(mathematicalBounds, { padding: [40, 40], animate: true, duration: 1.2 });
    } else {
      mapInstance.setView(center, 14, { animate: true });
    }
  };

  useEffect(() => {
    if (mapInstance && center && searchRadius) {
      try {
        const radiusInMeters = Number(searchRadius) * 1000;
        const centerLatLng = L.latLng(center[0], center[1]);
        const mathematicalBounds = centerLatLng.toBounds(radiusInMeters * 2);
        
        mapInstance.fitBounds(mathematicalBounds, { padding: [40, 40] });
      } catch (e) {
        console.error("Initial load bounds error:", e);
      }
    }
  }, [mapInstance, center, searchRadius]);

  if (!center) return (
    <div className="w-full h-[450px] bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 font-bold tracking-widest text-[10px] uppercase border border-dashed border-slate-300">
      Awaiting GPS telemetry...
    </div>
  );

  return (
    <div className="relative w-full h-[450px] bg-slate-50 rounded-3xl border border-slate-200/60 shadow-sm mb-6 overflow-hidden">
      
      {/* FIXED: Changed z-[9999] to z-[1000].
        This keeps the buttons ABOVE the map, but BELOW the z-[2000] profile drawer! 
      */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        
        {/* The GPS Focus Button */}
        <button 
          onClick={handleGPSClick}
          onPointerDown={(e) => e.stopPropagation()} 
          title="Focus on Task Coordinates"
          className="w-10 h-10 flex items-center justify-center bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm text-slate-600 hover:text-blue-600 hover:bg-white transition-all active:scale-95 cursor-pointer"
        >
          <Crosshair size={18} strokeWidth={2.5} />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); mapInstance?.zoomIn(); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Zoom In"
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b border-slate-100 transition-colors active:bg-slate-100 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); mapInstance?.zoomOut(); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Zoom Out"
            className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors active:bg-slate-100 cursor-pointer"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* MAP ENGINE */}
      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
        zoomControl={false}
        ref={setMapInstance} 
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        <Marker position={center} icon={incidentIcon} />
        
        {searchRadius > 0 && (
          <Circle 
            center={center} 
            radius={Number(searchRadius) * 1000} 
            pathOptions={{ fillColor: 'rgba(59, 130, 246, 0.08)', fillOpacity: 1, color: '#3b82f6', weight: 1.5, dashArray: '4, 8' }} 
          />
        )}

        {candidates?.map((v) => {
          if (!v.location || !v.location.coordinates) return null;
          return (
            <Marker 
              key={v._id} 
              position={[v.location.coordinates[1], v.location.coordinates[0]]} 
              icon={volunteerIcon}
              eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
            >
              <Popup closeButton={false}>
                <div className="p-1 min-w-[200px] font-sans">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 m-0 leading-tight">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider">{v.category}</p>
                    </div>
                  </div>
                  <div className="mb-4 text-[11px] font-bold text-slate-500">
                    Proximity: <span className="text-blue-600">{v.distanceInKm} km</span>
                  </div>
                  <button 
                    onClick={() => onSelectVolunteer(v._id)}
                    className="w-full py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    View Details <ExternalLink size={12} />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TacticalMap;