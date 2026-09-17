import React, { useState, useRef } from 'react';
import { FinancialEvolutionPoint } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { ArrowRight, ChevronDown, Maximize2, Minimize2, Info, Calendar, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialEvolutionChartProps { 
  isLoading?: boolean;
  data: FinancialEvolutionPoint[];
  onViewAnalysis?: () => void;
}

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  isLoading,
  data,
  onViewAnalysis,
}) => {
  const { formatValue } = usePrivacy();

  const [selectedPeriod, setSelectedPeriod] = useState<'Este mês' | 'Últimos 3 meses' | 'Este ano'>('Este mês');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [comparePrevious, setComparePrevious] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG Chart Geometry
  const width = 500;
  const height = 210;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 12;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxY = 6000;

  const getX = (index: number) => {

    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {

    return paddingTop + chartHeight - (val / maxY) * chartHeight;
  };

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (points: { x: number; y: number }[]) => {

    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const receitasPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.receitas) }));
  const despesasPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.despesas) }));
  const saldoPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.saldo) }));

  const receitasPath = generateSmoothPath(receitasPoints);
  const despesasPath = generateSmoothPath(despesasPoints);
  const saldoPath = generateSmoothPath(saldoPoints);

  // Previous month data calculation & trend line
  const getPreviousPoint = (d: FinancialEvolutionPoint, index: number) => {
    if (d.saldoAnterior !== undefined) {
      return {
        saldo: d.saldoAnterior,
        receitas: d.receitasAnterior ?? Math.round(d.receitas * 0.85),
        despesas: d.despesasAnterior ?? Math.round(d.despesas * 0.9),
        dateLabel: d.previousDateLabel ?? d.date.replace(/Mai|May|Jun|Jul/i, 'Abr'),
      };
    }
    const defaultPrevSaldo = [0, 1350, 1800, 2350, 2850];
    const saldo = index < defaultPrevSaldo.length ? defaultPrevSaldo[index] : Math.round(d.saldo * 0.82);
    return {
      saldo,
      receitas: Math.round(d.receitas * 0.82),
      despesas: Math.round(d.despesas * 0.9),
      dateLabel: d.date.replace(/Mai|May|Jun|Jul/i, 'Abr'),
    };
  };

  const previousSaldoPoints = data.map((d, i) => ({
    x: getX(i),
    y: getY(getPreviousPoint(d, i).saldo),
  }));
  const previousSaldoPath = generateSmoothPath(previousSaldoPoints);

  // Overall comparison metrics
  const latestCurrentSaldo = data.length > 0 ? data[data.length - 1].saldo : 0;
  const latestPrevSaldo = data.length > 0 ? getPreviousPoint(data[data.length - 1], data.length - 1).saldo : 0;
  const totalDiffAmount = latestCurrentSaldo - latestPrevSaldo;
  const totalDiffPercent = latestPrevSaldo > 0 ? ((totalDiffAmount / latestPrevSaldo) * 100) : 0;

  const hoveredPoint = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;
  const hoveredPrevPoint = hoveredIndex !== null && data[hoveredIndex] ? getPreviousPoint(data[hoveredIndex], hoveredIndex) : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const scaleX = width / svgRect.width;
    const svgX = mouseX * scaleX;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const px = getX(i);
      const diff = Math.abs(px - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIndex(closestIdx);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0 || !e.touches[0]) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - svgRect.left;
    const scaleX = width / svgRect.width;
    const svgX = touchX * scaleX;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const px = getX(i);
      const diff = Math.abs(px - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIndex(closestIdx);
  };

  if (isLoading) {
    return (

      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md animate-pulse min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-32 bg-slate-800 rounded"></div>
          <div className="h-6 w-16 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-[180px] w-full bg-slate-800/30 rounded-xl my-auto"></div>
        <div className="mt-4 pt-3 flex justify-between border-t border-slate-800/60">
           <div className="w-24 h-2 bg-slate-800 rounded"></div>
           <div className="w-16 h-2 bg-slate-800 rounded"></div>
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
            ? 'fixed inset-4 sm:inset-10 md:inset-20 z-50 bg-[#0b1325]/95 border border-slate-700/60 rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl overflow-hidden'
            : 'absolute inset-0 bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xl overflow-hidden backdrop-blur-sm z-10'
        }
      >
      {/* Header with Title, Legends, and Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Evolução Financeira
          </h3>

          {/* Inline Legends with Comparison Mode */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            {comparePrevious ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
                  <span className="text-cyan-300 font-semibold text-[11px]">Mês Atual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 border-t-2 border-dashed border-[#818cf8] shadow-[0_0_6px_#818cf8]" />
                  <span className="text-indigo-300 font-semibold text-[11px]">Mês Anterior</span>
                </div>
                {totalDiffAmount !== 0 && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                    totalDiffAmount >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    <TrendingUp className="w-2.5 h-2.5" />
                    {totalDiffAmount >= 0 ? `+${totalDiffPercent.toFixed(1)}%` : `${totalDiffPercent.toFixed(1)}%`}
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
                  <span className="text-slate-300 font-medium">Receitas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
                  <span className="text-slate-300 font-medium">Despesas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#06b6d4] shadow-[0_0_6px_#06b6d4]" />
                  <span className="text-slate-300 font-medium">Saldo</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls: Comparison Toggle, Period Selector & Expand */}
        <div className="flex items-center gap-2">
          {/* Comparison with Previous Month Toggle Button */}
          <button
            onClick={() => setComparePrevious(!comparePrevious)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              comparePrevious
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_14px_rgba(99,102,241,0.3)] font-semibold'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
            title="Comparar evolução atual com o mês anterior"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">vs. Mês Anterior</span>
            <span className="sm:hidden">Comparar</span>
            {comparePrevious && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          {/* Period Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors"
            >
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#0f172a] border border-slate-700 rounded-xl shadow-xl py-1 z-30">
                {(['Este mês', 'Últimos 3 meses', 'Este ano'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPeriod(p);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      selectedPeriod === p
                        ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div 
        className="relative w-full flex-1 min-h-0 overflow-x-auto overflow-y-visible select-none py-2 flex flex-col justify-center items-center"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="relative w-full min-w-[380px] sm:min-w-[480px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full max-h-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchMove}
          >
            <defs>
              <linearGradient id="verticalIndicatorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.1" />
                <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="previousTrendGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis labels */}
            {[6000, 4000, 2000, 0].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    R$ {val === 0 ? '0' : `${val / 1000}k`}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Vertical Grid Ticks & X-Axis labels */}
            {data.map((d, i) => {
              const x = getX(i);
              const isHovered = hoveredIndex === i;
              return (
                <g key={d.date}>
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[10px] font-medium transition-colors duration-150 ${
                      isHovered ? 'fill-cyan-300 font-bold' : 'fill-slate-400'
                    }`}
                  >
                    {d.date}
                  </text>
                </g>
              );
            })}

            {/* Curves */}
            {/* Receitas (Green) - smoothly dimmed in comparison mode */}
            <path
              d={receitasPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={comparePrevious ? 0.25 : 1}
              className="transition-opacity duration-300"
              style={{ filter: comparePrevious ? 'none' : 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}
            />

            {/* Despesas (Red) - smoothly dimmed in comparison mode */}
            <path
              d={despesasPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={comparePrevious ? 0.25 : 1}
              className="transition-opacity duration-300"
              style={{ filter: comparePrevious ? 'none' : 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))' }}
            />

            {/* Trend Line 2: Previous Month (Mês Anterior - shown when comparePrevious is enabled) */}
            {comparePrevious && (
              <g className="transition-all duration-300">
                {/* Soft ambient blur for previous month line */}
                <path
                  d={previousSaldoPath}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="5"
                  strokeOpacity="0.25"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
                {/* Crisp dashed trend line */}
                <path
                  d={previousSaldoPath}
                  fill="none"
                  stroke="url(#previousTrendGradient)"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.6))' }}
                />
              </g>
            )}

            {/* Trend Line 1: Current Month (Mês Atual - Cyan) */}
            <path
              d={saldoPath}
              fill="none"
              stroke="#00f0ff"
              strokeWidth={comparePrevious ? 3 : 2.5}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(var(--theme-glow-rgb), 0.6))' }}
            />

            {/* Smooth Vertical Line Indicator on Hover */}
            {hoveredIndex !== null && data[hoveredIndex] && (
              <g className="pointer-events-none transition-all duration-150 ease-out">
                {/* Soft glowing ambient line */}
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop - 4}
                  x2={getX(hoveredIndex)}
                  y2={height - paddingBottom + 4}
                  stroke="#00f0ff"
                  strokeWidth="5"
                  strokeOpacity="0.18"
                  className="transition-all duration-150 ease-out"
                />

                {/* Main crisp vertical indicator line */}
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop - 4}
                  x2={getX(hoveredIndex)}
                  y2={height - paddingBottom + 4}
                  stroke="url(#verticalIndicatorGradient)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  className="transition-all duration-150 ease-out"
                />

                {/* Receitas intersection point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex].receitas)}
                  r={comparePrevious ? 3 : 4}
                  fill="#10b981"
                  stroke="#060b14"
                  strokeWidth="2"
                  opacity={comparePrevious ? 0.4 : 1}
                  className="transition-all duration-150 ease-out"
                  style={{ filter: comparePrevious ? 'none' : 'drop-shadow(0 0 6px #10b981)' }}
                />

                {/* Despesas intersection point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex].despesas)}
                  r={comparePrevious ? 3 : 4}
                  fill="#ef4444"
                  stroke="#060b14"
                  strokeWidth="2"
                  opacity={comparePrevious ? 0.4 : 1}
                  className="transition-all duration-150 ease-out"
                  style={{ filter: comparePrevious ? 'none' : 'drop-shadow(0 0 6px #ef4444)' }}
                />

                {/* Previous Month intersection point (when comparison mode is active) */}
                {comparePrevious && hoveredPrevPoint && (
                  <g className="transition-all duration-150 ease-out">
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(hoveredPrevPoint.saldo)}
                      r="5.5"
                      fill="#818cf8"
                      stroke="#060b14"
                      strokeWidth="2.5"
                      style={{ filter: 'drop-shadow(0 0 10px #818cf8)' }}
                    />
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getY(hoveredPrevPoint.saldo)}
                      r="2"
                      fill="#ffffff"
                    />
                  </g>
                )}

                {/* Saldo (Current Month Trend) prominent glowing intersection point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex].saldo)}
                  r="6"
                  fill="#00f0ff"
                  stroke="#060b14"
                  strokeWidth="2.5"
                  className="transition-all duration-150 ease-out"
                  style={{ filter: 'drop-shadow(0 0 10px #00f0ff)' }}
                />
                {/* Inner white highlight on Saldo point */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(data[hoveredIndex].saldo)}
                  r="2"
                  fill="#ffffff"
                  className="transition-all duration-150 ease-out"
                />
              </g>
            )}

            {/* Interactive touch/mouse hover slices */}
            {data.map((d, i) => {
              const x = getX(i);
              return (
                <rect
                  key={`slice-${d.date}`}
                  x={x - chartWidth / (data.length * 2)}
                  y={paddingTop}
                  width={chartWidth / data.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onTouchStart={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>

          {/* Floating Hover Tooltip positioned smoothly at the hovered point */}
          <AnimatePresence>
            {hoveredIndex !== null && hoveredPoint && (
              <motion.div
                key={`tooltip-${hoveredIndex}`}
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`absolute z-30 pointer-events-none transition-all duration-150 ease-out ${
                  hoveredIndex <= 1
                    ? 'translate-x-[-18px] top-1 sm:top-2'
                    : hoveredIndex >= data.length - 2
                    ? 'translate-x-[calc(-100%+18px)] top-1 sm:top-2'
                    : '-translate-x-1/2 top-1 sm:top-2'
                }`}
                style={{
                  left: `${(getX(hoveredIndex) / width) * 100}%`,
                }}
              >
                <div
                  className="relative bg-[#070e1e]/95 border border-cyan-500/50 rounded-xl p-2.5 shadow-2xl backdrop-blur-md min-w-[210px] sm:min-w-[235px] text-xs"
                  style={{
                    boxShadow: comparePrevious 
                      ? '0 0 25px rgba(99, 102, 241, 0.35)' 
                      : '0 0 25px rgba(var(--theme-glow-rgb), 0.35)',
                  }}
                >
                  {/* Date & Indicator header */}
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{hoveredPoint.fullDate || hoveredPoint.date}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      comparePrevious 
                        ? 'text-indigo-300 bg-indigo-950/80 border-indigo-500/40' 
                        : 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30'
                    }`}>
                      {comparePrevious ? 'Comparativo' : 'Consolidado'}
                    </span>
                  </div>

                  {comparePrevious && hoveredPrevPoint ? (
                    /* Comparison Mode Details */
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2">
                        {/* Mês Atual */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-cyan-400 font-semibold uppercase flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00f0ff]" /> Mês Atual
                          </span>
                          <span className="text-sm font-black text-cyan-300 font-mono tracking-tight mt-0.5">
                            {formatValue(hoveredPoint.saldo)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{hoveredPoint.date}</span>
                        </div>

                        {/* Mês Anterior */}
                        <div className="flex flex-col border-l border-slate-800/80 pl-2">
                          <span className="text-[9px] text-indigo-400 font-semibold uppercase flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_#818cf8]" /> Mês Anterior
                          </span>
                          <span className="text-sm font-black text-indigo-300 font-mono tracking-tight mt-0.5">
                            {formatValue(hoveredPrevPoint.saldo)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{hoveredPrevPoint.dateLabel}</span>
                        </div>
                      </div>

                      {/* Variance / Growth Badge */}
                      {(() => {
                        const diff = hoveredPoint.saldo - hoveredPrevPoint.saldo;
                        const pct = hoveredPrevPoint.saldo > 0 ? (diff / hoveredPrevPoint.saldo) * 100 : 0;
                        const isPos = diff >= 0;
                        return (
                          <div className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
                            isPos 
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                              : 'bg-red-950/40 border-red-500/30 text-red-300'
                          }`}>
                            <span className="text-[10px] text-slate-400 uppercase font-sans flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-current" /> Variação:
                            </span>
                            <span className="font-bold">
                              {isPos ? '+' : ''}{formatValue(diff)} {hoveredPrevPoint.saldo > 0 ? `(${isPos ? '+' : ''}${pct.toFixed(1)}%)` : ''}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Sub-metrics: Receitas & Despesas */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono border-t border-slate-800/80">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Receitas
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {formatValue(hoveredPoint.receitas)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-slate-400 uppercase flex items-center justify-end gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Despesas
                          </span>
                          <span className="text-red-400 font-bold">
                            {formatValue(hoveredPoint.despesas)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Standard Mode */
                    <>
                      {/* Primary Focus: Exact Balance for this specific point */}
                      <div className="flex items-baseline justify-between gap-2 mb-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2.5 py-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Saldo:</span>
                        <span className="text-sm font-black text-cyan-300 font-mono tracking-tight">
                          {formatValue(hoveredPoint.saldo)}
                        </span>
                      </div>

                      {/* Detailed breakdown: Receitas & Despesas */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono border-t border-slate-800/80">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#10b981]" /> Receitas
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {formatValue(hoveredPoint.receitas)}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-slate-400 uppercase flex items-center justify-end gap-1 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_4px_#ef4444]" /> Despesas
                          </span>
                          <span className="text-red-400 font-bold">
                            {formatValue(hoveredPoint.despesas)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Caret pointing down to the vertical line */}
                  <div
                    className={`absolute -bottom-1.5 w-3 h-3 bg-[#070e1e] border-r border-b border-cyan-500/50 transform rotate-45 ${
                      hoveredIndex <= 1
                        ? 'left-[18px]'
                        : hoveredIndex >= data.length - 2
                        ? 'right-[18px]'
                        : 'left-1/2 -translate-x-1/2'
                    }`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <button
          onClick={onViewAnalysis}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-medium group"
        >
          <span>Ver análise detalhada</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      </motion.div>
    </div>
  );
};
