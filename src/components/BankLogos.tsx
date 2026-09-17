import React from 'react';
import { BankSlug } from '../types';

interface BankLogoProps {
  slug: BankSlug | string;
  className?: string;
  size?: number;
}

export const BankLogo: React.FC<BankLogoProps> = ({ slug, className = 'w-9 h-9', size = 36 }) => {
  switch (slug) {
    case 'c6':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-black border border-slate-700/60 shadow-inner overflow-hidden font-black text-white ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          <span className="text-[13px] tracking-tighter">C6</span>
        </div>
      );

    case 'bradesco':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#cc092f] shadow-md shadow-red-900/30 overflow-hidden text-white ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          {/* Bradesco classic tree-arches logo */}
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 4v16" strokeLinecap="round" />
            <path d="M6 10c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round" />
            <path d="M4 16c0-5 4-8 8-8s8 3 8 8" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'itau':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#1d3557] border border-blue-900/60 shadow-md overflow-hidden ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          <div className="bg-[#ec7000] text-[#1d3557] font-extrabold text-[12px] px-1 py-0.5 rounded tracking-tight leading-none">
            itaú
          </div>
        </div>
      );

    case 'santander-pf':
    case 'santander-pj':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl ${slug === 'santander-pj' ? 'bg-[#990000]' : 'bg-[#ec0000]'} shadow-md shadow-red-950/40 overflow-hidden text-white ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          {/* Santander iconic triple flame */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C10.5 4.5 9 6.5 9 9c0 2 1.3 3.5 3 4 1.7-.5 3-2 3-4 0-2.5-1.5-4.5-3-7z" />
            <path d="M7 8C6 9.5 5 11 5 13c0 2.5 1.8 4.2 4 4.5-.2-.7-.2-1.5 0-2.2C7.8 14.8 7 14 7 13c0-1 .8-2.2 1.5-3.2L7 8z" />
            <path d="M17 8l-1.5 1.8c.7 1 1.5 2.2 1.5 3.2 0 1-.8 1.8-2 2.3.2.7.2 1.5 0 2.2 2.2-.3 4-2 4-4.5 0-2-1-3.5-2-5z" />
          </svg>
        </div>
      );

    case 'mercado-pago':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#009ee3] shadow-md shadow-blue-900/30 overflow-hidden text-white ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          {/* Mercado Pago handshake icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M9 13.5l3 3 7.5-7.5-3-3L9 13.5z" opacity="0.9" />
            <path d="M4.5 10.5l4.5 4.5 1.5-1.5-4.5-4.5z" />
            <path d="M15 15l-3 3-4.5-4.5 1.5-1.5L12 15l1.5-1.5z" opacity="0.6" />
          </svg>
        </div>
      );

    case 'nubank':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#820ad1] text-white font-black text-xs tracking-tighter shadow-md ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          nu
        </div>
      );

    case 'inter':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#ff7a00] text-white font-black text-xs tracking-tight shadow-md ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          inter
        </div>
      );

    case 'bb':
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-[#f8d210] text-[#003882] font-black text-xs tracking-tight shadow-md ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          BB
        </div>
      );

    default:
      return (
        <div 
          className={`flex items-center justify-center rounded-xl bg-slate-800 text-cyan-400 font-bold text-xs border border-cyan-500/20 ${className}`}
          style={{ width: size, height: size, minWidth: size }}
        >
          BANK
        </div>
      );
  }
};
