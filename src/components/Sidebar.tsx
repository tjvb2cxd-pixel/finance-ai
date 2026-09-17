import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import {
  Home,
  Wallet,
  CreditCard,
  ListOrdered,
  Calendar,
  BarChart3,
  TrendingUp,
  Receipt,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export type NavItemKey =
  | 'visao-geral'
  | 'contas'
  | 'cartoes'
  | 'transacoes'
  | 'calendario'
  | 'relatorios'
  | 'investimentos'
  | 'despesas-fixas';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  lastSyncTime: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeProfile: UserProfile;
  onOpenProfiles: () => void;
  cloudStatus?: 'synced' | 'saving' | 'offline';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isSyncing,
  onTriggerSync,
  lastSyncTime,
  isOpenMobile = false,
  onCloseMobile,
  cloudStatus = 'synced',
}) => {
  const menuItems: { key: NavItemKey; label: string; icon: React.ElementType }[] = [
    { key: 'visao-geral', label: 'Visão Geral', icon: Home },
    { key: 'contas', label: 'Contas', icon: Wallet },
    { key: 'cartoes', label: 'Cartões', icon: CreditCard },
    { key: 'calendario', label: 'Calendário & Vencimentos', icon: Calendar },
    { key: 'transacoes', label: 'Transações', icon: ListOrdered },
    { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { key: 'despesas-fixas', label: 'Despesas Fixas', icon: Receipt },
    { key: 'investimentos', label: 'Investimentos', icon: TrendingUp },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Desktop Placeholder to prevent layout shift */}
      <div className="hidden lg:block w-[76px] shrink-0" />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen border-r border-slate-800/80 p-4 lg:p-3 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out overflow-x-hidden group/sidebar whitespace-nowrap lg:hover:delay-200 ${
          isOpenMobile 
            ? 'translate-x-0 w-64 bg-[#050a14]' 
            : '-translate-x-full lg:translate-x-0 w-64 lg:w-[76px] lg:hover:w-64 bg-[#050a14] lg:hover:bg-[#050a14]/80 lg:hover:backdrop-blur-md lg:hover:shadow-2xl'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center mb-6 lg:px-1 pt-1">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)]">
              F
            </div>
            <div className="flex flex-col ml-3 transition-all duration-300 overflow-hidden opacity-100 max-w-[200px] lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[200px]">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none mb-1.5">
                <span>FINANCE</span>
                <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide leading-none">
                Controle inteligente
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectTab(item.key);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center p-2 rounded-xl text-xs font-semibold transition-colors duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Sliding active background indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute inset-0 bg-[#0a182e] border border-cyan-500/50 shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.25)] rounded-xl"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  {/* Sliding vertical indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarBar"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r-md shadow-[0_0_10px_rgba(var(--theme-glow-rgb),0.8)] z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center relative z-10">
                    <Icon
                      className={`w-[18px] h-[18px] transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                  </div>
                  
                  <span className="transition-all duration-300 overflow-hidden whitespace-nowrap opacity-100 max-w-[200px] ml-2 lg:opacity-0 lg:max-w-0 lg:ml-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:ml-2 relative z-10">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] transition-all duration-300 opacity-100 max-w-[6px] lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[6px] z-10" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Nuvem Conectada Badge & Sync */}
        <div className="pt-3 border-t border-slate-800/80">
          <div
            className="bg-[#0a1426] border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl p-2 flex items-center relative overflow-hidden transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.12)]"
            title="Nuvem Conectada (Firestore) - Suas transações e contas são salvas automaticamente na nuvem"
          >
            {/* Cloud Icon & Pulsing Ping Indicator */}
            <div className="w-9 h-9 shrink-0 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-300 relative shadow-inner">
              <Cloud className="w-4 h-4 text-cyan-400" />
              {/* Pulsing indicator dot */}
              <div className="absolute -top-1 -right-1 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 border border-[#050a14] relative" />
              </div>
            </div>

            {/* Expanded Label & Status */}
            <div className="flex flex-col ml-3 transition-all duration-300 overflow-hidden opacity-100 max-w-[160px] lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-[160px]">
              <span className="text-[11px] font-bold text-slate-100 tracking-tight whitespace-nowrap block leading-none mb-1">
                Nuvem Conectada
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-cyan-300/90 leading-none">
                  {cloudStatus === 'saving' ? 'Salvando...' : 'Firestore Ativo'}
                </span>
              </div>
            </div>

            {/* Quick sync action button */}
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              title="Sincronizar dados bancários agora"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all duration-300 disabled:opacity-50 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          <div className="mt-2.5 text-center transition-all duration-300 overflow-hidden opacity-100 max-h-8 lg:opacity-0 lg:max-h-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-h-8">
            <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-0.5">Última sincronização</p>
            <p className="text-slate-400 text-[11px] font-medium">{lastSyncTime}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
