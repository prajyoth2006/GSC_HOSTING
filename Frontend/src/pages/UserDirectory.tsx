import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Filter, Mail, Wrench } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  createdAt: string;
  isAvailable?: boolean; // Added to support volunteer availability
}

export default function UserDirectory() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('All');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!authToken) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        let url = 'http://localhost:8000/api/v1/admins/users';
        if (roleFilter !== 'All') {
          url += `?role=${roleFilter}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        const json = await response.json();

        if (json.success) {
          setUsers(json.data);
        } else {
          setError(json.message || "Failed to fetch directory.");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Could not connect to the VolunMatch server on port 8000.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [roleFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Worker': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Volunteer': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Personnel Directory</h2>
        <p className="text-slate-500 font-medium mt-1">Manage and view all registered VolunMatch users.</p>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <div className="border-b border-slate-100 bg-slate-50/50 rounded-t-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Network Roster</CardTitle>
              <CardDescription className="text-slate-500 mt-1">
                Showing {users.length} {roleFilter === 'All' ? 'total users' : `${roleFilter.toLowerCase()}s`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 shadow-sm font-medium cursor-pointer transition-colors"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admins Only</option>
                <option value="Worker">Workers Only</option>
                <option value="Volunteer">Volunteers Only</option>
              </select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-red-600 bg-red-50 m-6 rounded-xl border border-red-200">
              <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium text-slate-500">Syncing directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Name & Role</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Contact & Status</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Operational Skills</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">

                      {/* Name & Role Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getRoleBadge(u.role)}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Status Column */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {u.email}
                          </div>

                          {/* ONLY show Availability if the user is a Volunteer */}
                          {u.role === 'Volunteer' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`h-2.5 w-2.5 rounded-full ${u.isAvailable !== false ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${u.isAvailable !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {u.isAvailable !== false ? 'Available for Assignment' : 'Unavailable'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Skills Column with Logic & Hover Tooltip */}
                      <td className="px-6 py-4">
                        {u.role === 'Admin' || u.role === 'Worker' ? (
                          <span className="text-slate-400 text-xs italic font-medium">Not applicable for {u.role}s</span>
                        ) : u.skills && u.skills.length > 0 ? (

                          /* Hover Reveal Group */
                          <div className="group/skills relative inline-block">

                            {/* Truncated UI */}
                            <div className="flex flex-wrap gap-1 cursor-help">
                              {u.skills.slice(0, 2).map((skill, index) => (
                                <span key={index} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">
                                  {skill}
                                </span>
                              ))}
                              {u.skills.length > 2 && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-bold">
                                  +{u.skills.length - 2} more
                                </span>
                              )}
                            </div>

                            {/* Tooltip Content (Full List) */}
                            <div className="invisible opacity-0 group-hover/skills:visible group-hover/skills:opacity-100 transition-all duration-200 absolute z-50 left-0 top-full mt-2 w-64 bg-slate-900 text-slate-50 text-xs leading-relaxed rounded-lg shadow-xl border border-slate-700 p-3">
                              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                              <div className="relative z-10 flex flex-wrap gap-1.5">
                                {u.skills.map((skill, index) => (
                                  <span key={index} className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-xs font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic flex items-center gap-1 font-medium">
                            <Wrench className="h-3 w-3" /> No skills registered
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          // Adding the leading slash "/" ensures it goes to localhost:3000/directory/ID
                          to={`/directory/${u._id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-8 px-4 text-slate-700 shadow-sm"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No {roleFilter === 'All' ? 'users' : `${roleFilter.toLowerCase()}s`} found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}