import React from 'react';  
import { motion } from 'framer-motion';  
import { Shield, Zap, Lock, Users } from 'lucide-react';  

const Hero = ({ onGetStarted }) => {  
  return (  
    // Changed py-20 to min-h-screen to ensure it fills the viewport but remains scrollable
    <section className="relative min-h-screen w-full flex flex-col justify-center items-center py-20 overflow-x-hidden bg-[#0f172a]">  
      
      {/* Background blobs - Expanded for full width */}
      <div className="absolute inset-0 overflow-hidden -z-10">  
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />  
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full" />  
      </div>  

      {/* Removed 'container' class to allow full width control */}
      <div className="w-full px-6 md:px-16">  
        
        {/* Main hero content - Max width applied here instead of the whole container */}
        <motion.div  
          initial={{ opacity: 0, y: 20 }}  
          animate={{ opacity: 1, y: 0 }}  
          transition={{ duration: 0.6 }}  
          className="max-w-5xl mx-auto text-center"
        >  
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">  
            Powered by Starknet ZK-Tech  
          </span>  
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">  
            The Future of <br />  
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">  
              Private Procurement  
            </span>  
          </h1>  

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">  
            Fairlance uses ZK-inspired sealed-bid auctions to prevent undercutting and favoritism.  
            Fair pricing, verifiable commitments, and decentralized trust.  
          </p>  

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">  
            <button  
              onClick={onGetStarted}  
              className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"  
            >  
              Get Started  
              <Zap className="w-4 h-4" />  
            </button>  
            <button className="w-full sm:w-auto px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700">  
              Read Whitepaper  
            </button>  
          </div>  
        </motion.div>  

        {/* Features grid - Full width on large screens */}
        <motion.div  
          initial={{ opacity: 0, y: 40 }}  
          animate={{ opacity: 1, y: 0 }}  
          transition={{ duration: 0.8, delay: 0.2 }}  
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto"  
        >  
          {[
            { icon: <Lock className="w-6 h-6 text-indigo-400" />, title: "Sealed Bids", desc: "Bids are cryptographically committed and hidden until the reveal phase." },
            { icon: <Shield className="w-6 h-6 text-emerald-400" />, title: "No Undercutting", desc: "Competitors cannot see your bid, preventing 'race to the bottom' tactics." },
            { icon: <Users className="w-6 h-6 text-orange-400" />, title: "Fair Selection", desc: "Algorithmic shortlisting based on efficiency, not just the lowest price." }
          ].map((feature, i) => (  
            <div key={i} className="p-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-left hover:border-indigo-500/50 transition-all group">  
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 border border-slate-700 group-hover:scale-110 transition-transform">  
                {feature.icon}  
              </div>  
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>  
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>  
            </div>  
          ))}  
        </motion.div>  
      </div>  
    </section>  
  );  
};  

export default Hero;