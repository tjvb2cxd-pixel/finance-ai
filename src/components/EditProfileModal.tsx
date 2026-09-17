import React, { useState, useEffect } from 'react';
import { UserProfile, AvatarId } from '../types';
import { RenderProfileAvatar } from './ProfileAvatars';
import { ConfirmDangerModal } from './ConfirmDangerModal';
import { X, Check, Trash2, Sparkles, UserPen, Lock, BellRing, Clock } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  totalProfilesCount: number;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  onDeleteProfile?: (id: string) => void;
}

const AVATAR_OPTIONS: { id: AvatarId; label: string }[] = [
  { id: 'roberto', label: 'Roberto' },
  { id: 'elfo', label: 'Elfo' },
  { id: 'rainha', label: 'Rainha' },
  { id: 'wandinha', label: 'Wandinha' },
  { id: 'astronauta', label: 'Astronauta' },
  { id: 'gato', label: 'Gato Ninja' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  totalProfilesCount,
  onSaveProfile,
  onDeleteProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [pin, setPin] = useState((profile.pin === '1234' ? '9921' : profile.pin) || '9921');
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarId>(profile.avatarId);
  const [billReminderEnabled, setBillReminderEnabled] = useState<boolean>(profile.billReminderEnabled ?? true);
  const [billReminderDaysBefore, setBillReminderDaysBefore] = useState<1 | 3 | 7>(profile.billReminderDaysBefore ?? 3);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setPin((profile.pin === '1234' ? '9921' : profile.pin) || '9921');
    setSelectedAvatarId(profile.avatarId);
    setBillReminderEnabled(profile.billReminderEnabled ?? true);
    setBillReminderDaysBefore(profile.billReminderDaysBefore ?? 3);
    setSavedSuccess(false);
    setShowConfirmDelete(false);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveProfile({
      ...profile,
      name: name.trim(),
      avatarId: selectedAvatarId,
      pin: pin.trim() || '9921',
      billReminderEnabled,
      billReminderDaysBefore,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#0b1325] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080e1b] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UserPen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Editar Perfil</h3>
              <p className="text-xs text-slate-400">Personalize seu nome, avatar e lembretes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Avatar Preview & Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Escolha seu Avatar
            </label>
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-[#060c18] border border-slate-800">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.6)] flex-shrink-0">
                <RenderProfileAvatar avatarId={selectedAvatarId} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Pré-visualização
                </span>
                <p className="text-sm font-bold text-white truncate">{name || 'Seu Nome'}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Avatar sincronizado com o FIN
                </p>
              </div>
            </div>

            {/* Grid of Avatars */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = selectedAvatarId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-400/50 scale-105'
                        : 'border-slate-800 bg-[#060c18] hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                      <RenderProfileAvatar avatarId={item.id} />
                      {isSelected && (
                        <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-cyan-300 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Nome do Perfil
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do perfil..."
              maxLength={24}
              className="w-full px-4 py-2.5 rounded-xl bg-[#060c18] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* PIN / Password Input */}
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
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 9921"
              className="w-full px-4 py-2.5 rounded-xl bg-[#060c18] border border-slate-700 text-white placeholder-slate-500 font-mono tracking-widest text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Senha exigida ao selecionar este perfil na tela inicial.
            </p>
          </div>

          {/* Configuração de Lembretes de Vencimento de Faturas */}
          <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl transition-colors ${
                  billReminderEnabled 
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' 
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                }`}>
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <label 
                    className="text-xs font-bold text-slate-200 block cursor-pointer select-none"
                    onClick={() => setBillReminderEnabled(!billReminderEnabled)}
                  >
                    Lembretes de Vencimento
                  </label>
                  <span className="text-[11px] text-slate-400 block">
                    Notificações antes de faturas e boletos vencerem
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={billReminderEnabled}
                onClick={() => setBillReminderEnabled(!billReminderEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  billReminderEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {billReminderEnabled && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Avisar com antecedência de:
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono font-medium">
                    {billReminderDaysBefore} {billReminderDaysBefore === 1 ? 'dia' : 'dias'} antes
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {([1, 3, 7] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBillReminderDaysBefore(days)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                        billReminderDaysBefore === days
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-[0_0_12px_rgba(var(--theme-glow-rgb),0.3)] ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-black">{days} {days === 1 ? 'dia' : 'dias'}</span>
                      <span className="text-[9px] font-normal opacity-75">de antecedência</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Clock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  O sistema alertará com destaque {billReminderDaysBefore} {billReminderDaysBefore === 1 ? 'dia' : 'dias'} antes de cada data de vencimento.
                </p>
              </div>
            )}
          </div>

          {/* Danger zone / Delete if more than 1 profile */}
          {totalProfilesCount > 1 && onDeleteProfile && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Excluir este perfil</span>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg transition-colors border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.4)] transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Salvo com Sucesso!
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>

        {/* Modal de Atenção / Confirmação de Exclusão de Perfil */}
        {onDeleteProfile && (
          <ConfirmDangerModal
            isOpen={showConfirmDelete}
            onClose={() => setShowConfirmDelete(false)}
            onConfirm={() => {
              setShowConfirmDelete(false);
              onDeleteProfile(profile.id);
              onClose();
            }}
            title="Excluir Perfil de Usuário"
            badgeText="Atenção: Ação Irreversível"
            description="Você tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita e removerá permanentemente as preferências salvas deste perfil."
            itemPreview={{
              icon: (
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-red-500/40 shadow-md flex-shrink-0">
                  <RenderProfileAvatar avatarId={profile.avatarId} />
                </div>
              ),
              title: profile.name,
              subtitle: profile.roleDescription || 'Perfil Personalizado',
              tag: 'Perfil',
              tagColor: 'bg-red-950/80 text-red-300 border border-red-500/30',
            }}
            impactPoints={[
              'O perfil será removido imediatamente de todas as telas de alternância rápida.',
              'Preferências visuais e configurações personalizadas serão excluídas.',
              'Se houver apenas um perfil restante, a exclusão será bloqueada no futuro.',
            ]}
            confirmButtonText="Sim, Excluir Perfil"
            cancelButtonText="Cancelar e Manter Perfil"
            variant="danger"
            actionType="delete"
          />
        )}
      </div>
    </div>
  );
};
