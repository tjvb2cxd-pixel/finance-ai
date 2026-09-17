import React, { useState } from 'react';
import { CategoryExpense } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { ArrowRight, Maximize2, Minimize2, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryDonutChartProps { 
  isLoading?: boolean;
  categories: CategoryExpense[];
  totalExpenses: number;
  onViewReport?: () => void;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  isLoading,
  categories,
  totalExpenses,
  onViewReport,
}) => {
  const { formatValue } = usePrivacy();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // SVG Donut geometry
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const slices = categories.map((cat) => {

    const percent = cat.percentage;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    // Start angle in radians (offset from -90 deg / 12 o'clock)
    const startAngle = (accumulatedPercent / 100) * 360 - 90;
    const midAngle = startAngle + ((percent / 100) * 360) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    
    // Label position along arc center
    const labelRadius = radius;
    const labelX = center + labelRadius * Math.cos(midRad);
    const labelY = center + labelRadius * Math.sin(midRad);

    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
      labelX,
      labelY,
      percent,
    };
  });

  const activeCategory = hoveredKey 
    ? categories.find(c => c.key === hoveredKey) 
    : null;

  if (isLoading) {
    return (

      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md animate-pulse min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-32 bg-slate-800 rounded"></div>
          <div className="h-6 w-16 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="flex items-center justify-center gap-6 my-auto flex-col sm:flex-row h-full">
          <div className="w-[180px] h-[180px] rounded-full border-[18px] border-slate-800/50 flex-shrink-0"></div>
          <div className="flex flex-col gap-3 w-full sm:w-auto min-w-[170px]">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex justify-between items-center py-1">
                 <div className="flex gap-2 items-center">
                   <div className="w-3 h-3 rounded-full bg-slate-800"></div>
                   <div className="w-20 h-3 bg-slate-800 rounded"></div>
                 </div>
                 <div className="w-12 h-3 bg-slate-700/80 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

    );
  }

  return (
    <div className="relative w-full h-full min-h-[350px] xl:min-h-[390px] 2xl:min-h-[430px]">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={
          isExpanded
            ? 'fixed inset-4 sm:inset-10 md:inset-20 lg:inset-32 xl:inset-40 z-50 bg-[#0b1325]/95 border border-slate-700/60 rounded-3xl p-6 sm:p-10 flex flex-col shadow-2xl overflow-hidden'
            : 'absolute inset-0 bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xl overflow-hidden backdrop-blur-sm z-10'
        }
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Despesas por Categoria
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Chart and Legend Layout */}
      <div className={`flex items-center justify-center gap-5 my-auto ${isExpanded ? "flex-col md:flex-row h-full" : "flex-col sm:flex-row"}`}>
        {/* Donut SVG */}
        <div className={`relative flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isExpanded ? "w-[240px] h-[240px] md:w-[320px] md:h-[320px] lg:w-[400px] lg:h-[400px]" : "w-[150px] h-[150px] sm:w-[165px] sm:h-[165px] xl:w-[185px] xl:h-[185px]"}`}>
          <svg
            className="w-full h-full transform -rotate-90 overflow-visible"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#0f1b33"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {

              const isHovered = hoveredKey === slice.key;
              return (
                <circle
                  key={slice.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 10px ${slice.color})` : 'none',
                    opacity: hoveredKey && !isHovered ? 0.45 : 1,
                  }}
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              );
            })}
          </svg>

          {/* Percentage text overlay inside donut */}
          <div className="absolute inset-0 pointer-events-none">
            {slices.map((slice) => {

              if (slice.percent < 8) return null; // Don't crowd tiny slices
              return (
                <div
                  key={`lbl-${slice.id}`}
                  className="absolute text-[10px] font-bold text-white tracking-tight drop-shadow-md"
                  style={{
                    left: `${(slice.labelX / size) * 100}%`,
                    top: `${(slice.labelY / size) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {slice.percent}%
                </div>
              );
            })}
          </div>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeCategory ? (
              <>
                <span className={`font-black text-white transition-all font-mono tracking-tight ${isExpanded ? "text-xl md:text-2xl" : "text-sm sm:text-base"}`}>
                  {formatValue(activeCategory.amount)}
                </span>
                <span className={`font-semibold transition-all line-clamp-1 ${isExpanded ? "text-sm md:text-base" : "text-[11px]"}`} style={{ color: activeCategory.color }}>
                  {activeCategory.name}
                </span>
              </>
            ) : (
              <>
                <span className={`font-black text-slate-100 tracking-tight transition-all font-mono ${isExpanded ? "text-xl md:text-2xl" : "text-sm sm:text-base"}`}>
                  {formatValue(totalExpenses)}
                </span>
                <span className={`font-semibold text-slate-400 uppercase tracking-wider transition-all ${isExpanded ? "text-sm md:text-base" : "text-[10px]"}`}>
                  Total
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className={`flex flex-col gap-1.5 sm:gap-2 w-full sm:w-auto flex-1 min-w-[170px] ${isExpanded ? "text-sm" : "text-xs"}`}>
          {categories.map((cat) => {
            const isHovered = hoveredKey === cat.key;
            const pct = totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredKey(cat.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between py-1 px-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isHovered ? 'bg-slate-800/90 border-slate-700/80 scale-[1.02] shadow-sm' : 'border-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: isHovered ? `0 0 8px ${cat.color}` : 'none',
                    }}
                  />
                  <span className={`font-medium truncate ${isHovered ? 'text-white' : 'text-slate-300'}`}>
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {totalExpenses > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {pct}%
                    </span>
                  )}
                  <span className={`font-bold text-slate-200 text-right font-mono ${isExpanded ? "text-sm" : "text-[11px]"}`}>
                    {formatValue(cat.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Distribuição por categorias
        </span>
        <button
          onClick={onViewReport}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-medium group"
        >
          <span>Ver relatório completo</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      </motion.div>
    </div>
  );
};
