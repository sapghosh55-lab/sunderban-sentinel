'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface TemporalSliderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
}

const TemporalSlider = ({ currentYear, onYearChange }: TemporalSliderProps) => {
  const years = [2022, 2023, 2024, 2025, 2026];
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const currentIndex = years.indexOf(currentYear);
        const nextIndex = (currentIndex + 1) % years.length;
        onYearChange(years[nextIndex]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentYear, onYearChange]);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[600px] z-10">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-slate-900 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tabular-nums">{currentYear}</span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Temporal Analysis</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={() => {
                const idx = years.indexOf(currentYear);
                if (idx > 0) onYearChange(years[idx - 1]);
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                const idx = years.indexOf(currentYear);
                if (idx < years.length - 1) onYearChange(years[idx + 1]);
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative h-1.5 bg-slate-800 rounded-full mb-2 group cursor-pointer">
          {/* Track marks */}
          <div className="absolute inset-0 flex justify-between px-1">
            {years.map((year) => (
              <div 
                key={year} 
                className={`w-1 h-1 rounded-full mt-0.25 ${year <= currentYear ? 'bg-emerald-400' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          
          {/* Progress fill */}
          <motion.div 
            className="absolute h-full bg-emerald-500 rounded-full"
            initial={false}
            animate={{ 
              width: `${((currentYear - 2022) / (2026 - 2022)) * 100}%` 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          {/* Interactive dots */}
          <div className="absolute inset-0 flex justify-between items-center -top-2">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => onYearChange(year)}
                className="group/dot relative"
              >
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                  year === currentYear 
                    ? 'bg-white border-emerald-500 scale-125 shadow-lg shadow-emerald-500/50' 
                    : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                }`} />
                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors ${
                  year === currentYear ? 'text-white' : 'text-slate-500'
                }`}>
                  {year}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalSlider;
