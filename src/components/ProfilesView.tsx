import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AvatarId } from '../types';
import { RenderProfileAvatar } from './ProfileAvatars';
import { ConfirmDangerModal } from './ConfirmDangerModal';
import { ProfilePasswordModal } from './ProfilePasswordModal';
import { Plus, Edit2, Trash2, Check, X, Sparkles, Loader2, Lock, BellRing, Clock } from 'lucide-react';

interface ProfilesViewProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (profile: UserProfile) => void;
  onAddProfile: (profile: Omit<UserProfile, 'id'>) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteProfile: (id: string) => void;
  onBackToDashboard?: () => void;
}

const PRESET_AVATARS: { id: AvatarId; name: string; label: string }[] = [
  { id: 'roberto', name: 'Roberto', label: 'Estilo Pop' },
  { id: 'elfo', name: 'Elfo', label: 'Fantasia' },
  { id: 'rainha', name: 'Rainha', label: 'Realeza' },
  { id: 'wandinha', name: 'Wandinha', label: 'Gótico' },
  { id: 'astronauta', name: 'Astronauta', label: 'Espacial' },
  { id: 'gato', name: 'Gato', label: 'Mascote' },
];

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onBackToDashboard,
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);

  // Loading animation state for selected profile
  const [loadingProfile, setLoadingProfile] = useState<UserProfile | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Profile Password Authentication Modal
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Handle clicking on profile: prompt for password
  const handleProfileClick = (profile: UserProfile) => {
    if (isManaging) {
      setEditingProfile(profile);
      return;
    }

    if (loadingProfile) return; // Prevent double trigger

    // Request password for this profile
    setAuthProfile(profile);
  };

  // Called when password is correct
  const handleAuthSuccess = (authenticatedProfile: UserProfile) => {
    setAuthProfile(null);
    setLoadingProfile(authenticatedProfile);
    setLoadingProgress(15);

    // Smoothly increment progress bar to 100% over 1.2s
    let progress = 15;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 12;
      if (progress >= 100) {
        progress = 100;
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
      setLoadingProgress(progress);
    }, 140);

    loadingTimerRef.current = setTimeout(() => {
      onSelectProfile(authenticatedProfile);
    }, 1250);
  };

  // New Profile Form State
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('9921');
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarId>('roberto');
  const [newBillReminderEnabled, setNewBillReminderEnabled] = useState(true);
  const [newBillReminderDaysBefore, setNewBillReminderDaysBefore] = useState<1 | 3 | 7>(3);

  const handleOpenAdd = () => {
    setNewName('');
    setNewPin('9921');
    setSelectedAvatarId('roberto');
    setNewBillReminderEnabled(true);
    setNewBillReminderDaysBefore(3);
    setIsAddModalOpen(true);
  };

  const handleSaveNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddProfile({
      name: newName.trim(),
      avatarId: selectedAvatarId,
      pin: newPin.trim() || '9921',
      billReminderEnabled: newBillReminderEnabled,
      billReminderDaysBefore: newBillReminderDaysBefore,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewPin('9921');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name.trim()) return;

    onUpdateProfile(editingProfile);
    setEditingProfile(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Background Radial Glow Effect */}
      <div 
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[140px] opacity-70" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between px-6 sm:px-12 py-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.6)]">
            F
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
            FINANCE <span className="text-cyan-400">AI</span>
          </span>
        </div>
      </header>

      {/* Center Main Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center tracking-tight mb-12 sm:mb-16">
          Qual seu perfil ?
        </h1>

        {/* Profiles Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-5xl">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const isLoadingThis = loadingProfile?.id === profile.id;
            const isAnyLoading = Boolean(loadingProfile);

            return (
              <div
                key={profile.id}
                className={`flex flex-col items-center group relative transition-all duration-300 ${
                  isAnyLoading && !isLoadingThis ? 'opacity-30 scale-95 pointer-events-none' : ''
                }`}
              >
                {/* Avatar Box */}
                <div
                  id={`profile-card-${profile.id}`}
                  onClick={() => handleProfileClick(profile)}
                  className={`relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform ${
                    isLoadingThis
                      ? 'scale-110 ring-4 ring-cyan-400 shadow-[0_0_40px_rgba(var(--theme-glow-rgb),0.9)] z-20'
                      : isActive
                      ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(var(--theme-glow-rgb),0.85)] scale-105 group-hover:scale-110'
                      : 'border border-transparent hover:ring-2 hover:ring-slate-400/50 shadow-lg group-hover:scale-105'
                  }`}
                >
                  <RenderProfileAvatar avatarId={profile.avatarId} />

                  {/* Active Profile Checkmark badge */}
                  {isActive && !isManaging && !isLoadingThis && (
                    <div className="absolute top-2 right-2 bg-cyan-500 text-black p-1 rounded-full shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Card Loading Spinner overlay */}
                  {isLoadingThis && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="p-2.5 rounded-full bg-cyan-500/90 text-black shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.9)] animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
                      </div>
                    </div>
                  )}

                  {/* Management Mode Overlay */}
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-2 p-2">
                      <button
                        title="Editar Perfil"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProfile(profile);
                        }}
                        className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg transition-transform hover:scale-110"
                      >
                        <Edit2 className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {profiles.length > 1 && (
                        <button
                          title="Excluir Perfil"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileToDelete(profile);
                          }}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Name */}
                <span
                  className={`mt-3.5 text-sm sm:text-base font-semibold tracking-wide transition-colors ${
                    isLoadingThis
                      ? 'text-cyan-300 font-bold scale-105'
                      : isActive
                      ? 'text-cyan-400 font-bold'
                      : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {profile.name}
                </span>
              </div>
            );
          })}

          {/* Adicionar Perfil Card */}
          <div className={`flex flex-col items-center group transition-all duration-300 ${
            loadingProfile ? 'opacity-30 scale-95 pointer-events-none' : ''
          }`}>
            <button
              id="btn-adicionar-perfil"
              onClick={handleOpenAdd}
              disabled={Boolean(loadingProfile)}
              className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-2xl border-2 border-dashed border-cyan-400/90 hover:border-cyan-300 bg-[#051322]/80 hover:bg-[#07192d]/90 flex items-center justify-center cursor-pointer transition-all duration-200 transform group-hover:scale-105 shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.35)] hover:shadow-[0_0_30px_rgba(var(--theme-glow-rgb),0.6)] disabled:opacity-50"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.5)] group-hover:border-cyan-300 group-hover:text-white transition-colors">
                <Plus className="w-8 h-8 stroke-[2.5]" />
              </div>
            </button>

            {/* Label below */}
            <span className="mt-3.5 text-sm sm:text-base font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
              Adicionar perfil
            </span>
          </div>
        </div>

        {/* Bottom Action: GERENCIAR PERFIS */}
        <div className="mt-14 sm:mt-16 flex flex-col items-center gap-3">
          <button
            id="btn-gerenciar-perfis"
            onClick={() => setIsManaging(!isManaging)}
            className={`px-8 py-3 rounded-xl border text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-200 ${
              isManaging
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.5)]'
                : 'bg-[#06101e] border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white shadow-lg'
            }`}
          >
            {isManaging ? 'CONCLUÍDO' : 'GERENCIAR PERFIS'}
          </button>

          {isManaging && (
            <p className="text-xs text-slate-400 animate-pulse">
              Selecione um perfil para editar o nome ou avatar, ou clique no botão de lixeira para remover.
            </p>
          )}
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-10 w-full text-center py-4 text-[11px] text-slate-500 font-medium">
        FINANCE AI &bull; Gestão Financeira Inteligente Multiperfil
      </footer>

      {/* FULL-SCREEN PROFILE LOADING TRANSITION OVERLAY */}
      {loadingProfile && (
        <div
          id="profile-loading-overlay"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020612]/95 backdrop-blur-xl select-none transition-all duration-300"
        >
          {/* Ambient Glows */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[130px] pointer-events-none animate-pulse" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
            {/* Avatar with spinning orbital ring */}
            <div className="relative mb-7">
              {/* Outer rotating dashed ring */}
              <div className="absolute -inset-4 rounded-3xl border-2 border-dashed border-cyan-400/80 animate-spin [animation-duration:8s]" />

              {/* Pulsing neon halo */}
              <div className="absolute -inset-2 rounded-2xl bg-cyan-400/25 blur-md animate-pulse" />

              {/* Avatar Box */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(var(--theme-glow-rgb),0.85)] ring-2 ring-cyan-400">
                <RenderProfileAvatar avatarId={loadingProfile.avatarId} />
              </div>

              {/* Glowing spinner badge */}
              <div className="absolute -bottom-2.5 -right-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black p-2.5 rounded-2xl shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.9)] ring-2 ring-black">
                <Loader2 className="w-5 h-5 animate-spin stroke-[2.5]" />
              </div>
            </div>

            {/* Profile Welcome Title */}
            <div className="space-y-1.5 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Conectando ao perfil
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {loadingProfile.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin [animation-duration:4s]" />
                <span>Sincronizando contas e dados bancários...</span>
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden border border-cyan-500/30 p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300 rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.9)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            {/* Percentage & Status indicator */}
            <div className="w-full flex justify-between items-center mt-2.5 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Carregando painel
              </span>
              <span className="font-bold text-cyan-300">{loadingProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Novo Perfil */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1325] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(var(--theme-glow-rgb),0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Adicionar Novo Perfil</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProfile} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nome do Perfil
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto, Sofia, Família..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    Senha / PIN de Acesso
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Padrão: 9921</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="9921"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono tracking-widest text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  PIN numérico exigido ao clicar neste perfil para entrar no sistema.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Escolha um Avatar
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${
                        selectedAvatarId === avatar.id
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md">
                        <RenderProfileAvatar avatarId={avatar.id} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-1.5">
                        {avatar.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuração de Lembretes de Vencimento */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      newBillReminderEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Lembretes de Vencimento</p>
                      <p className="text-[10px] text-slate-400">Avisos automáticos de faturas</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newBillReminderEnabled}
                    onClick={() => setNewBillReminderEnabled(!newBillReminderEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      newBillReminderEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        newBillReminderEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {newBillReminderEnabled && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in">
                    <span className="text-[10px] font-medium text-slate-400">
                      Antecedência do aviso:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {([1, 3, 7] as const).map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewBillReminderDaysBefore(days)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                            newBillReminderDaysBefore === days
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {days} {days === 1 ? 'dia' : 'dias'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Perfil */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0b1325] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(var(--theme-glow-rgb),0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Editar Perfil</h3>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nome do Perfil
                </label>
                <input
                  type="text"
                  required
                  value={editingProfile.name}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    Alterar Senha / PIN de Acesso
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ex: 9921</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ex: 9921"
                  value={editingProfile.pin || ''}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      pin: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono tracking-widest text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Defina uma senha de 4 dígitos para proteger este perfil.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Alterar Avatar
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() =>
                        setEditingProfile({ ...editingProfile, avatarId: avatar.id })
                      }
                      className={`flex flex-col items-center p-2 rounded-2xl border transition-all ${
                        editingProfile.avatarId === avatar.id
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md">
                        <RenderProfileAvatar avatarId={avatar.id} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-1.5">
                        {avatar.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuração de Lembretes de Vencimento de Faturas */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      (editingProfile.billReminderEnabled ?? true) ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Lembretes de Vencimento</p>
                      <p className="text-[10px] text-slate-400">Notificações antes do vencimento</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editingProfile.billReminderEnabled ?? true}
                    onClick={() =>
                      setEditingProfile({
                        ...editingProfile,
                        billReminderEnabled: !(editingProfile.billReminderEnabled ?? true),
                      })
                    }
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      (editingProfile.billReminderEnabled ?? true) ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        (editingProfile.billReminderEnabled ?? true) ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {(editingProfile.billReminderEnabled ?? true) && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in">
                    <span className="text-[10px] font-medium text-slate-400">
                      Antecedência do aviso:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {([1, 3, 7] as const).map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setEditingProfile({
                              ...editingProfile,
                              billReminderDaysBefore: days,
                            })
                          }
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                            (editingProfile.billReminderDaysBefore ?? 3) === days
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {days} {days === 1 ? 'dia' : 'dias'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editingProfile.name.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)] disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Atenção / Confirmação para Excluir Perfil */}
      <ConfirmDangerModal
        isOpen={Boolean(profileToDelete)}
        onClose={() => setProfileToDelete(null)}
        onConfirm={() => {
          if (profileToDelete) {
            onDeleteProfile(profileToDelete.id);
            setProfileToDelete(null);
          }
        }}
        title="Excluir Perfil de Usuário"
        badgeText="Atenção: Ação Irreversível"
        description="Você tem certeza que deseja excluir este perfil? Esta ação apagará permanentemente o perfil e não poderá ser desfeita."
        itemPreview={
          profileToDelete
            ? {
                icon: (
                  <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-red-500/40 shadow-md flex-shrink-0">
                    <RenderProfileAvatar avatarId={profileToDelete.avatarId} />
                  </div>
                ),
                title: profileToDelete.name,
                subtitle: profileToDelete.roleDescription || 'Perfil de Usuário',
                tag: profileToDelete.id === activeProfileId ? 'Perfil Ativo' : 'Perfil',
                tagColor:
                  profileToDelete.id === activeProfileId
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    : 'bg-red-950/80 text-red-300 border border-red-500/30',
              }
            : undefined
        }
        impactPoints={[
          'O perfil será removido imediatamente de todas as telas de alternância rápida.',
          'Configurações e preferências exclusivas vinculadas a este perfil serão excluídas.',
          profileToDelete?.id === activeProfileId
            ? 'Como este é o perfil atualmente ativo, você será automaticamente alternado para outro perfil disponível.'
            : 'Outros perfis existentes permanecerão intactos.',
        ]}
        confirmButtonText="Sim, Excluir Perfil"
        cancelButtonText="Cancelar e Manter Perfil"
        variant="danger"
        actionType="delete"
      />

      {/* Modal de Senha / Autenticação do Perfil */}
      <ProfilePasswordModal
        isOpen={Boolean(authProfile)}
        profile={authProfile ? (profiles.find((p) => p.id === authProfile.id) || authProfile) : null}
        onClose={() => setAuthProfile(null)}
        onSuccess={handleAuthSuccess}
        onUpdateProfilePin={(profileId, newPin) => {
          const target = profiles.find((p) => p.id === profileId);
          if (target) {
            const updated = { ...target, pin: newPin };
            onUpdateProfile(updated);
            setAuthProfile(updated);
          }
        }}
      />
    </div>
  );
};
