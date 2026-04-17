import React, { useState } from 'react';
import { UserMinus, AlertCircle } from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js'; // Adjust path if needed

const UnassignButton = ({ taskId, onUnassignSuccess }) => {
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [error, setError] = useState(null);

  const handleUnassign = async () => {
    // 1. Safety check: prevent accidental clicks
    if (!window.confirm("Are you sure you want to revoke this assignment? The task will return to the Triage Queue.")) {
      return;
    }

    setIsUnassigning(true);
    setError(null);

    try {
      // 2. Grab the token we fixed earlier!
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      // 3. Make the request to your backend
      const response = await fetch(`${BASE_URL}/dispatch/${taskId}/unassign`, {
        method: 'PATCH', // Must match your Express router.patch()
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      // 4. Handle backend errors gracefully
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to unassign volunteer.");
      }

      // 5. Success! Tell the parent component to update the UI
      if (onUnassignSuccess) {
        onUnassignSuccess(taskId); 
      }

    } catch (err) {
      console.error("Unassign error:", err);
      setError(err.message);
    } finally {
      setIsUnassigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleUnassign}
        disabled={isUnassigning}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
          isUnassigning 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200 shadow-sm'
        }`}
      >
        {isUnassigning ? (
          <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
        ) : (
          <UserMinus size={18} />
        )}
        {isUnassigning ? 'Revoking Assignment...' : 'Unassign Volunteer'}
      </button>

      {/* Show inline error if the request fails */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 mt-1">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UnassignButton;