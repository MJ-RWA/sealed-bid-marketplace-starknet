import React from 'react';
import { motion } from 'framer-motion';

const Roadmap = () => {
  const milestones = [
    { period: "Q1 2026", title: "Alpha Launch", desc: "Core sealed-bid protocol on Starknet Testnet.", status: "completed" },
    { period: "Q2 2026", title: "ZK-Proof Integration", desc: "Moving bid commitments to full ZK-proofs for maximum privacy.", status: "current" },
    { period: "Q3 2026", title: "Mainnet Beta", desc: "Public launch with STRK and USDC payment support.", status: "upcoming" },
    { period: "Q4 2026", title: "DAO Governance", desc: "Community-led protocol updates and dispute resolution.", status: "upcoming" }
  ];

  return (
    // Removed container, added w-full and min-h-screen for scale
    <section className="w-full py-32 bg-[#0f172a] relative overflow-hidden">
      
      {/* Decorative background element to break the "flat" look */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Roadmap</h2>
          <p className="text-slate-400 text-lg">Our journey towards a fairer marketplace.</p>
        </div>

        <div className="relative">
          {milestones.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-12 mb-20 last:mb-0 group"
            >
              {/* Timeline Track */}
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-4 shadow-lg ${
                  m.status === 'completed' ? 'bg-emerald-500 border-emerald-500/20' :
                  m.status === 'current' ? 'bg-indigo-500 border-indigo-500/20 animate-pulse' :
                  'bg-slate-800 border-slate-700'
                }`} />
                {i !== milestones.length - 1 && (
                  <div className="w-1 flex-1 bg-gradient-to-b from-slate-800 to-transparent my-4 rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="pb-12 border-b border-slate-800/50 flex-1">
                <span className="text-sm font-bold text-indigo-400 uppercase tracking-[0.2em]">{m.period}</span>
                <h3 className="text-3xl font-bold mt-2 mb-4 text-white group-hover:text-indigo-400 transition-colors">
                  {m.title}
                </h3>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;