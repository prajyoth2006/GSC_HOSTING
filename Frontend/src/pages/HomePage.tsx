import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, ShieldAlert, LogOut, 
  User as UserIcon, Settings, Key, ChevronUp ,
  ClipboardList
} from 'lucide-react';

export default function Home() {
  const location = useLocation();
  const { user, logout } = useAuth(); // Connected to real IIT Patna auth context

  const navItems = [
    { path: '/home', label: 'Dashboard Overview', icon: LayoutDashboard },
    { path: '/operations', label: 'Operational Log', icon: ClipboardList },
    { path: '/directory', label: 'Personnel Directory', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- CLEAN PROFESSIONAL SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-white h-screen sticky top-0 flex-col border-r border-slate-200 shadow-sm z-50">
        
        {/* Branding Header - Clean Gray & Red */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="p-2 bg-red-50 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">VolunMatch</h1>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase mt-1">Operations Portal</span>
          </div>
        </div>

        {/* Navigation Links - Light Theme with Soft Blue Active State */}
        <nav className="p-4 space-y-1 flex-grow overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
              
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER: User Profile Section with Light Dropup */}
        <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="relative group">
            
            {/* CLEAN DROPUP MENU */}
            <div className="absolute bottom-full left-0 right-0 mb-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[60]">
              <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 min-w-[200px]">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Settings</p>
                </div>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <UserIcon className="w-3.5 h-3.5" />
                  My Profile
                </Link>
                <Link to="/update-details" className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Edit Details
                </Link>
                <Link to="/update-password" className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Key className="w-3.5 h-3.5" />
                  Security Settings
                </Link>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45"></div>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-slate-200 group-hover:border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 font-black text-blue-700 text-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  {user?.role || 'Admin'}
                  <ChevronUp className="w-2.5 h-2.5 text-slate-300" />
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="w-full mt-4 flex items-center gap-3 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT SCROLL AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-5 sticky top-0 z-40">
          <h2 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase">
            {location.pathname === '/' ? 'Operational Overview' : 
             location.pathname.startsWith('/directory') ? 'Personnel Directory' : 
             location.pathname.startsWith('/profile') ? 'Profile Management' : 'System Setup'}
          </h2>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}