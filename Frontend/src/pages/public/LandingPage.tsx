import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; 
import { 
  HeartHandshake, 
  BrainCircuit, 
  Menu, 
  X, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <HeartHandshake size={24} />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Volun<span className="text-blue-600">Match</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Features</a>
              
              <div className="flex items-center space-x-4 ml-4 border-l border-slate-200 pl-4">
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg flex items-center gap-2"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-500 hover:text-slate-900 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4 shadow-xl"
          >
            <a href="#how-it-works" className="block text-base font-bold text-slate-600 py-2">How it Works</a>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="w-full text-center py-3 text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50">
                Login
              </Link>
              <Link to="/register" className="w-full text-center py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20">
                Register
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
                  <Zap size={14} /> AI-Powered Matching Engine
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                Your Skills, Their Mission. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                  Perfectly Matched by AI.
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              >
                Connect with opportunities that match your passion. Our intelligent platform pairs dedicated volunteers with organizations that need them most.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              >
                <Link to="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg flex items-center justify-center gap-2 group">
                  Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-sm flex items-center justify-center">
                  Login to Profile
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section id="how-it-works" className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:bg-white transition-all">
                <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                  <BrainCircuit size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Smart Matching</h3>
                <p className="text-slate-500 font-medium leading-relaxed">AI algorithms connect your specific skills with organizational needs instantly.</p>
              </div>

              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:bg-white transition-all">
                <div className="h-14 w-14 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-6 border border-sky-100">
                  <HeartHandshake size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Real Impact</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Track your contributions and watch the community growth you help create.</p>
              </div>

              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:bg-white transition-all">
                <div className="h-14 w-14 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center mb-6 border border-slate-300">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Secure Platform</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Role-based access ensures your data and privacy are always protected.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HeartHandshake className="text-blue-500 w-6 h-6" />
            <span className="text-xl font-black text-white tracking-tight">VolunMatch</span>
          </div>
          <p className="mb-8 font-medium">Empowering social change through intelligent connections.</p>
          <div className="pt-8 border-t border-slate-800 text-sm font-semibold tracking-wide">
            © {new Date().getFullYear()} VolunMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;