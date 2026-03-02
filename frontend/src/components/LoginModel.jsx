import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User, Wallet } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onSelectRole, pendingRole, onConnect, setPendingRole, loading }) => {
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
        {/* Header Section */}
        <h2 className="text-3xl font-black mb-2 text-center text-white">
          {!pendingRole ? "Welcome Back" : "Ready to Connect?"}
        </h2>
        <p className="text-slate-400 text-center mb-10">
          {!pendingRole 
            ? "Select your role to continue to the marketplace." 
            : `You're logging in as a ${pendingRole}.`}
        </p>

        {!pendingRole ? (
          /* STEP 1: ROLE SELECTION (Your original UI) */
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
        ) : (
          /* STEP 2: CONNECT WALLET */
          <div className="flex flex-col items-center">
            <button
              onClick={onConnect}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-3"
            >
              <Wallet className="w-6 h-6" />
             {loading ? "Connecting..." : "Connect Wallet"}
            </button>
              {loading && (
           <button
           onClick={onClose}
           disabled={loading}
           className="mt-6 text-slate-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 opacity-50 cursor-not-allowed"
           >
          ✕ Cancel request...
          </button>
)}
            <button
              onClick={() => setPendingRole(null)}
              className="mt-6 text-slate-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
            >
              ← Back to role selection
            </button>
          </div>
        )}

        {/* Footer (Only show on step 1) */}
        {!pendingRole && (
          <button
            onClick={onClose}
            className="mt-8 w-full text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Maybe later
          </button>
        )}
      </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;