import React from 'react';
import Hero from './Hero';
import Team from './Team';
import Roadmap from './Roadmap';
import { motion } from 'framer-motion';

const LandingPage = ({ onGetStarted }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Ensure the background spans the entire screen
      className="bg-slate-950 text-slate-100 min-h-screen w-full"
    >
      <Hero onGetStarted={onGetStarted} />
      <Team />
      <Roadmap />
      
      {/* CTA Section - Responsive and Full Width */}
      <section className="w-full py-24 md:py-32 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tighter text-white">
            Ready to hire <br className="hidden sm:block" /> or get hired?
          </h2>
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-12 py-5 bg-white text-indigo-600 font-black text-lg rounded-2xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-900/20"
          >
            Join Fairlance Now
          </button>
        </div>
      </section>

      <footer className="py-16 border-t border-slate-800/50 bg-slate-950 text-center text-slate-500 text-sm">
        <p>&copy; 2026 Fairlance. Built with ZK-Tech on Starknet.</p>
      </footer>
    </motion.div>
  );
};

export default LandingPage;