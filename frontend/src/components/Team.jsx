import React from 'react';
import { motion } from 'framer-motion';
import mekjah from '../assets/mekjah.jpeg';
import joel from '../assets/joel.jpeg';
import erasmus from '../assets/erasmus.jpeg';
import Ashraf from '../assets/Ashraf.jpeg';
import daniel from '../assets/daniel.jpeg';


const Team = () => {
  const members = [
    { name: "Mekjah Bassey", role: "Frontend Developer", image: mekjah},
    { name: "Ekezie Daniel", role: "Backend/Contract Developer", image: daniel },
    { name: "Ashraf Amoka", role: "UI/UX Designer", image: Ashraf },
    { name: "Chidiebere Edeh", role: "Graphic Designer", image: joel },
    { name: "Chigozie Erasmus", role: "Graphic Designer", image: erasmus },
    
    
  ];

  return (
    // Use w-full and a darker shade to separate it from the Hero
    <section className="w-full py-32 bg-slate-900/80 border-t border-slate-800">
      {/* We use a max-width wrapper ONLY for the content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-left md:text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">The Team</h2>
          <p className="text-slate-400 text-lg max-w-2xl md:mx-auto">
            Building the infrastructure for the next generation of work.
          </p>
        </div>

        {/* Grid is now more spacious */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {members.map((member, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="group text-center"
            >
              <div className="relative mb-8 inline-block">
                {/* Larger glow effect */}
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" />
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-slate-800 relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
              <p className="text-sm text-indigo-400 font-bold uppercase tracking-[0.2em]">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;