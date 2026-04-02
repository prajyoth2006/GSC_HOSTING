import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { BASE_URL } from '../../utils/constants.js';

const ALLOWED_CATEGORIES = [
    'Medical', 'Rescue', 'Food & Water', 'Shelter',
    'Sanitation', 'Labor', 'Transport', 'Supplies',
    'Animal Rescue', 'Infrastructure', 'Other'
];

export default function UpdateUserRole() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [adminKey, setAdminKey] = useState('');
    const [role, setRole] = useState('Worker');
    const [category, setCategory] = useState('');
    const [skills, setSkills] = useState('');
    const [lng, setLng] = useState('');
    const [lat, setLat] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 1. Safely grab the token using the exact same logic as your UserDirectory
        const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

        if (!authToken) {
            setError("Authentication token not found. Please log in again.");
            setLoading(false);
            return;
        }

        const payload = {
            adminKey,
            role,
            ...(role === 'Volunteer' && {
                category,
                skills: skills.split(',').map(s => s.trim()),
                location: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                }
            })
        };

        try {
            const response = await fetch(`${BASE_URL}/admins/update-role/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // 2. Use the authToken variable here
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/directory'), 2000);
            } else {
                setError(data.message || "Failed to update role");
            }
        } catch (err) {
            setError("Server connection error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </button>

            <Card>
                <CardHeader>
                    <CardTitle>Transition User Role</CardTitle>
                    <p className="text-sm text-slate-500">Upgrade or switch between Worker and Volunteer status.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Admin Key */}
                        <div>
                            <label className="block text-sm font-bold mb-1">Master Admin Key</label>
                            <input
                                type="password" required
                                className="w-full border rounded-md p-2"
                                value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                                placeholder="Enter secret admin key"
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-bold mb-1">Target Role</label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={role} onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="Worker">Worker</option>
                                <option value="Volunteer">Volunteer</option>
                            </select>
                        </div>

                        {/* Conditional Volunteer Fields */}
                        {role === 'Volunteer' && (
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Volunteer Category</label>
                                    <select
                                        required className="w-full border rounded-md p-2 bg-white"
                                        value={category} onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="">Select a Category</option>
                                        {ALLOWED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-1">Skills (comma separated)</label>
                                    <input
                                        type="text" className="w-full border rounded-md p-2 bg-white"
                                        value={skills} onChange={(e) => setSkills(e.target.value)}
                                        placeholder="e.g. CPR, Driving, Cooking"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Longitude</label>
                                        <input type="number" step="any" required className="w-full border rounded-md p-2 bg-white" value={lng} onChange={(e) => setLng(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Latitude</label>
                                        <input type="number" step="any" required className="w-full border rounded-md p-2 bg-white" value={lat} onChange={(e) => setLat(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
                        {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Role updated successfully!</div>}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300"
                        >
                            {loading ? "Processing..." : "Update Role Now"}
                        </button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}