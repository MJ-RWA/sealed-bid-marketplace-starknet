import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onSelectRole }) => {
  // Return null if not open to prevent rendering
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-3xl font-black mb-2 text-center text-white">Welcome Back</h2>
          <p className="text-slate-400 text-center mb-10">Select your role to continue to the marketplace.</p>

          <div className="grid grid-cols-1 gap-4">
            {/* Employer Selection */}
            <button
              onClick={() => onSelectRole('employer')}
              className="group p-6 bg-slate-800/50 hover:bg-indigo-600/10 border border-slate-700 hover:border-indigo-500 rounded-2xl transition-all text-left flex items-center gap-6"
            >
              <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 transition-all">
                <Briefcase className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">I'm an Employer</h3>
                <p className="text-sm text-slate-500">I want to post jobs and hire talent.</p>
              </div>
            </button>

            {/* Freelancer Selection */}
            <button
              onClick={() => onSelectRole('freelancer')}
              className="group p-6 bg-slate-800/50 hover:bg-emerald-600/10 border border-slate-700 hover:border-emerald-500 rounded-2xl transition-all text-left flex items-center gap-6"
            >
              <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-emerald-500/50 transition-all">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">I'm a Freelancer</h3>
                <p className="text-sm text-slate-500">I want to find work and submit bids.</p>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;