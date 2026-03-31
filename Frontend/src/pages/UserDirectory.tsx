import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Filter, Mail, Wrench, MoreHorizontal, UserCog, User as UserIcon } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  createdAt: string;
  isAvailable?: boolean;
}

export default function UserDirectory() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  
  // State to manage which row's dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Close dropdown if user clicks anywhere else on the page
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent the document click listener from firing immediately
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
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
            <div className="overflow-x-visible pb-16"> {/* pb-16 prevents dropdowns from being cut off at the bottom */}
              <table className="w-full text-sm text-left relative">
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
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Name & Role */}
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

                      {/* Contact & Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {u.email}
                          </div>
                          {u.role === 'Volunteer' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={`h-2.5 w-2.5 rounded-full ${u.isAvailable !== false ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${u.isAvailable !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {u.isAvailable !== false ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Skills Tooltip logic */}
                      <td className="px-6 py-4">
                        {u.role === 'Admin' || u.role === 'Worker' ? (
                          <span className="text-slate-400 text-xs italic font-medium">Not applicable for {u.role}s</span>
                        ) : u.skills && u.skills.length > 0 ? (
                          <div className="group/skills relative inline-block">
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

                      {/* Actions Column with 3 Dots Menu */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={(e) => toggleDropdown(e, u._id)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {/* Custom Dropdown Menu */}
                        {openDropdownId === u._id && (
                          <div 
                            className="absolute right-6 top-10 z-[100] w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 text-left"
                            onClick={(e) => e.stopPropagation()} // Prevent clicking inside the menu from closing it immediately
                          >
                            <Link
                              to={`/directory/${u._id}`}
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full"
                            >
                              <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
                              View Profile
                            </Link>
                            
                            {/* Hide Role Update button if user is an Admin */}
                            {u.role !== 'Admin' && (
                              <Link
                                to={`/update-role/${u._id}`}
                                className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full font-medium"
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Update User Role
                              </Link>
                            )}
                          </div>
                        )}
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