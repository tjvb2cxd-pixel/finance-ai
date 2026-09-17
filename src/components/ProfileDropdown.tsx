import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserProfile } from '../types';
import { RenderProfileAvatar } from './ProfileAvatars';
import { UserPen, Sliders, LogOut, Users, ChevronRight, Check, Sparkles, RotateCcw, Trash2 } from 'lucide-react';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onOpenEditProfile: () => void;
  onOpenAccountSettings: () => void;
  onOpenAllProfiles: () => void;
  onLogout: () => void;
  onRestoreDemoData?: () => void;
  onZeroAllValues?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  activeProfile,
  profiles,
  onSelectProfile,
  onOpenEditProfile,
  onOpenAccountSettings,
  onOpenAllProfiles,
  onLogout,
  onRestoreDemoData,
  onZeroAllValues,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const otherProfiles = profiles.filter((p) => p.id !== activeProfile.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          id="profile-dropdown-menu"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0b1325]/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] z-50 p-3 text-xs overflow-hidden origin-top-right ring-1 ring-cyan-500/20 animate-fade-in-down"
        >
          {/* Active Profile Info Header */}
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#060c18] border border-slate-800/80 mb-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-cyan-400/80 shadow-[0_0_12px_rgba(var(--theme-glow-rgb),0.4)] flex-shrink-0">
          <RenderProfileAvatar avatarId={activeProfile.avatarId} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm truncate">{activeProfile.name}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Conectado" />
          </div>
          <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Perfil Ativo &bull; Open Finance
          </span>
        </div>
      </div>

      {/* Main Action Items */}
      <div className="space-y-1">
        {/* 1. Editar Perfil */}
        <button
          id="dropdown-opt-editar-perfil"
          onClick={() => {
            onClose();
            onOpenEditProfile();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
              <UserPen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200 group-hover:text-white text-xs">Editar Perfil</p>
              <p className="text-[10px] text-slate-400">Alterar nome e avatar do perfil</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </button>

        {/* 2. Configurações de Conta */}
        <button
          id="dropdown-opt-configuracoes-conta"
          onClick={() => {
            onClose();
            onOpenAccountSettings();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200 group-hover:text-white text-xs">Configurações de Conta</p>
              <p className="text-[10px] text-slate-400">Preferências, segurança e moeda</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
        </button>

        {/* 3. Zerar Todos os Valores */}
        {onZeroAllValues && (
          <button
            id="dropdown-opt-zero-values"
            onClick={() => {
              onClose();
              onZeroAllValues();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-950/30 text-left transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-red-300 text-xs">Zerar Todos os Valores</p>
                <p className="text-[10px] text-slate-400">Limpar histórico e zerar saldos (R$ 0,00)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </button>
        )}

        {/* 4. Restaurar Dados Demonstrativos */}
        {onRestoreDemoData && (
          <button
            id="dropdown-opt-restore-demo"
            onClick={() => {
              onClose();
              onRestoreDemoData();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-950/40 text-left transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-cyan-300 text-xs">Recarregar Dados Exemplo</p>
                <p className="text-[10px] text-slate-400">Preencher com dados de teste</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Quick Switch Profiles Section (if other profiles exist) */}
      {otherProfiles.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" />
              Trocar de Perfil
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenAllProfiles();
              }}
              className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-1">
            {otherProfiles.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onClose();
                  onSelectProfile(p);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg overflow-hidden ring-1 ring-slate-700 group-hover:ring-cyan-400/60 flex-shrink-0">
                    <RenderProfileAvatar avatarId={p.avatarId} />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">
                    {p.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 font-mono">
                  Trocar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-1.5 border-t border-slate-800" />

      {/* 3. Sair */}
      <button
        id="dropdown-opt-sair"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors group"
      >
        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
          <LogOut className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-xs">Sair</p>
          <p className="text-[10px] text-slate-400">Desconectar e voltar à tela de perfis</p>
        </div>
      </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
