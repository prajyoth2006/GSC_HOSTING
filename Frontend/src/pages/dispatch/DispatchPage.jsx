import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

// Components
import TriageList from './components/TriageList'; 
import IncidentHeader from './components/IncidentHeader';
import TacticalMap from './components/TacticalMap';
import CandidateList from './components/CandidateList';
import VolunteerProfile from './components/VolunteerProfile';
import SmartSortToggle from './components/SmartSortToggle'; 
import { BASE_URL } from '../../utils/constants.js';

const DispatchPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentTask = location.state?.taskData;

  // --- STATE ---
  const [baseCandidates, setBaseCandidates] = useState([]); 
  const [candidates, setCandidates] = useState([]); 
  const [searchRadius, setSearchRadius] = useState(0);
  const [loadingMap, setLoadingMap] = useState(false);
  
  // AI States
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  
  // Assignment States
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [missionLocked, setMissionLocked] = useState(false);

  // 1. Initial Load (Hard Filter)
  useEffect(() => {
    if (!taskId) return; 
    const fetchMissionData = async () => {
      setLoadingMap(true);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const response = await fetch(`${BASE_URL}/dispatch/${taskId}/candidates/hard-filter`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          const sortedByDistance = data.data.candidates.sort((a,b) => a.distanceInKm - b.distanceInKm);
          setBaseCandidates(sortedByDistance);
          setCandidates(sortedByDistance);
          setSearchRadius(data.data.searchRadiusKm);
        }
      } catch (error) {
        console.error("Map load failed:", error);
      } finally {
        setLoadingMap(false);
      }
    };
    fetchMissionData();
  }, [taskId]);

  // 2. AI Smart Sort
  useEffect(() => {
    if (!taskId || baseCandidates.length === 0) return;
    if (aiEnabled) {
      const fetchAIScores = async () => {
        setIsAILoading(true);
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
          const response = await fetch(`${BASE_URL}/dispatch/${taskId}/candidates/smart-sort`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (result.success) {
            const aiData = result.data.candidates;
            const mergedCandidates = baseCandidates.map(base => {
              const aiMatch = aiData.find(ai => ai._id === base._id);
              return aiMatch ? { ...base, matchPercentage: aiMatch.matchPercentage, aiReasoning: aiMatch.aiReasoning } : base;
            });
            mergedCandidates.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
            setCandidates(mergedCandidates);
          }
        } catch (error) {
          setAiEnabled(false); 
        } finally {
          setIsAILoading(false);
        }
      };
      fetchAIScores();
    } else {
      setCandidates([...baseCandidates]);
    }
  }, [aiEnabled, taskId]); 

  // --- THE ASSIGNMENT FUNCTION ---
  const handleAssignVolunteer = async (volunteerId) => {
    if (!window.confirm("Confirm deployment of this personnel?")) return;
    
    // We store the specific volunteerId so the button loader knows exactly which row is loading
    setIsAssigning(volunteerId);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/dispatch/${taskId}/assign`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ volunteerId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSelectedVolunteerId(null); 
        setMissionLocked(true); 
        
        setTimeout(() => {
          navigate('/triage');
        }, 2500);
      } else {
        alert(result.message || "Failed to assign volunteer.");
      }
    } catch (error) {
      alert("Network error during assignment.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!taskId) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <div className="mb-8"><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Emergency Triage</h1></div>
        <TriageList />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* SUCCESS OVERLAY */}
      {missionLocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <CheckCircle2 size={100} className="text-emerald-400 mb-6 animate-bounce" />
          <h1 className="text-4xl font-black uppercase tracking-widest text-emerald-400 mb-2 text-center">Mission Locked</h1>
          <p className="text-slate-300 font-medium tracking-wide text-center">Personnel deployed successfully. Returning to triage...</p>
        </div>
      )}

      {/* Max-width container to keep things readable on ultra-wide screens, but still full width */}
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        <button onClick={() => navigate('/triage')} className="flex items-center gap-2 text-slate-500 hover:text-blue-700 font-bold w-fit transition-colors">
          <ArrowLeft size={18} /> Return to Queue
        </button>

        {currentTask && !loadingMap ? (
          <>
            <IncidentHeader task={currentTask} />
            
            {/* FULL WIDTH MAP */}
            <div className="w-full">
              <TacticalMap 
                taskLocation={currentTask.location} 
                candidates={candidates} 
                searchRadius={searchRadius} 
                onSelectVolunteer={setSelectedVolunteerId} 
              />
            </div>
            
            {/* FULL WIDTH TOGGLE */}
            <div className="w-full">
              <SmartSortToggle 
                aiEnabled={aiEnabled} 
                setAiEnabled={setAiEnabled} 
                isAILoading={isAILoading} 
              />
            </div>

            {/* FULL WIDTH TABLE */}
            <div className="w-full">
              <CandidateList 
                candidates={candidates} 
                aiEnabled={aiEnabled} 
                isAILoading={isAILoading}
                onSelectVolunteer={setSelectedVolunteerId}
                onAssignVolunteer={handleAssignVolunteer}
                isAssigning={isAssigning}
              />
            </div>
          </>
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <VolunteerProfile 
        volunteerId={selectedVolunteerId} 
        onClose={() => setSelectedVolunteerId(null)} 
        onAssignVolunteer={handleAssignVolunteer} 
        isAssigning={isAssigning}
      />
    </div>
  );
};

export default DispatchPage;