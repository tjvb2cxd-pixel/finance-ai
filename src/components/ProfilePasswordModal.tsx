import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { RenderProfileAvatar } from './ProfileAvatars';
import { 
  Lock, 
  Unlock, 
  X, 
  KeyRound, 
  Delete, 
  RotateCcw, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  triggerSuccessFeedback, 
  triggerErrorFeedback, 
  triggerKeyClickFeedback 
} from '../utils/feedback';

interface ProfilePasswordModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  onUpdateProfilePin?: (profileId: string, newPin: string) => void;
}

export const ProfilePasswordModal: React.FC<ProfilePasswordModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSuccess,
  onUpdateProfilePin,
}) => {
  const [pin, setPin] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Expected pin: defaults to '9921' (legacy '1234' is automatically updated to '9921')
  const targetPin = (profile?.pin === '1234' ? '9921' : profile?.pin) || '9921';

  // Automatically migrate legacy 1234 to 9921 in profile if detected
  useEffect(() => {
    if (profile && profile.pin === '1234' && onUpdateProfilePin) {
      onUpdateProfilePin(profile.id, '9921');
      profile.pin = '9921';
    }
  }, [profile, onUpdateProfilePin]);

  // Reset state when opening or switching profile
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsShake(false);
      setErrorMsg(null);
      setIsSuccess(false);
      setIsResetMode(false);
      setNewPinInput('');
      setConfirmNewPinInput('');
    }
  }, [isOpen, profile]);

  // Handle Physical Keyboard Typing
  useEffect(() => {
    if (!isOpen || !profile || isResetMode || isTextMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length > 0) {
          validatePin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, profile, pin, isResetMode, isTextMode]);

  // Focus text input if in text mode
  useEffect(() => {
    if (isTextMode && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextMode]);

  if (!isOpen || !profile) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length >= 6 || isSuccess) return;
    triggerKeyClickFeedback();
    setErrorMsg(null);
    const newPin = pin + digit;
    setPin(newPin);

    // Auto-verify if reaches target pin length (usually 4)
    const requiredLength = targetPin.length || 4;
    if (newPin.length === requiredLength) {
      validatePin(newPin);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isSuccess) {
      triggerKeyClickFeedback();
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    triggerKeyClickFeedback();
    setPin('');
    setErrorMsg(null);
  };

  const validatePin = (inputPin: string) => {
    if (inputPin === targetPin) {
      setIsSuccess(true);
      triggerSuccessFeedback();
      setTimeout(() => {
        onSuccess(profile);
      }, 500);
    } else {
      triggerErrorFeedback();
      setIsShake(true);
      setErrorMsg('Senha incorreta.');
      setTimeout(() => {
        setIsShake(false);
        setPin('');
      }, 500);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setErrorMsg('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setErrorMsg('Os PINs digitados não coincidem.');
      return;
    }

    if (onUpdateProfilePin) {
      onUpdateProfilePin(profile.id, newPinInput);
    }
    profile.pin = newPinInput;

    setIsSuccess(true);
    triggerSuccessFeedback();
    setTimeout(() => {
      onSuccess({ ...profile, pin: newPinInput });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/90 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Background glow behind modal */}
      <div className="pointer-events-none absolute w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[120px]" />

      <div 
        className={`relative w-full max-w-sm bg-[#0a1224] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col items-center text-center transition-transform duration-200 ${
          isShake ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* Top Header Controls */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Acesso Seguro</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Voltar aos Perfis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Avatar */}
        <div className="relative mb-3.5">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 transition-all shadow-xl ${
            isSuccess 
              ? 'ring-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]' 
              : 'ring-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
          }`}>
            <RenderProfileAvatar avatarId={profile.avatarId} />
          </div>

          <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl text-white shadow-md transition-colors ${
            isSuccess ? 'bg-emerald-500' : 'bg-cyan-500 text-black'
          }`}>
            {isSuccess ? (
              <Unlock className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Lock className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
        </div>

        {/* Profile Name & Instructions */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {profile.name}
        </h3>
        
        {!isResetMode ? (
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Digite sua senha para desbloquear o painel
          </p>
        ) : (
          <p className="text-xs text-cyan-300 mt-1 mb-5">
            Defina uma nova senha para este perfil
          </p>
        )}

        {/* NORMAL PIN MODE */}
        {!isResetMode ? (
          <>
            {/* PIN Dots Display */}
            {!isTextMode ? (
              <div className="flex items-center justify-center gap-3.5 mb-6">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-200 ${
                        isSuccess
                          ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-110'
                          : isFilled
                          ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.7)] scale-110'
                          : 'border-slate-700 bg-slate-900/80'
                      }`}
                    />
                  );
                })}
              </div>
            ) : (
              /* Text Input Mode */
              <div className="w-full mb-6 relative">
                <input
                  ref={textInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pin.length > 0) {
                      validatePin(pin);
                    }
                  }}
                  placeholder="Digite a senha..."
                  className="w-full py-2.5 px-4 pr-11 bg-slate-900/90 border border-slate-700 rounded-xl text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium mb-4 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-xl animate-shake">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Virtual Keypad (when not in text mode) */}
            {!isTextMode && (
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigitClick(num.toString())}
                    className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-white transition-all transform active:scale-95 shadow-sm"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear (C) */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-2xl bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95"
                  title="Limpar"
                >
                  C
                </button>

                {/* 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitClick('0')}
                  className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-lg font-bold text-white transition-all transform active:scale-95 shadow-sm"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-2xl bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
                  title="Apagar"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Text Mode Submit button */}
            {isTextMode && (
              <button
                type="button"
                onClick={() => validatePin(pin)}
                disabled={pin.length === 0}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 mb-4"
              >
                Entrar
              </button>
            )}

            {/* Bottom auxiliary links */}
            <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center justify-between w-full px-1">
                <button
                  type="button"
                  onClick={() => setIsTextMode(!isTextMode)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {isTextMode ? 'Usar Teclado Numérico' : 'Digitar no teclado'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Esqueci / Alterar PIN
                </button>
              </div>

              {/* Default hint */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>Senha do perfil: <strong className="text-cyan-400">9921</strong></span>
              </div>
            </div>
          </>
        ) : (
          /* RESET / CHANGE PIN MODE */
          <form onSubmit={handleSaveNewPin} className="w-full space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Novo PIN (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 9921"
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Novo PIN
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={confirmNewPinInput}
                onChange={(e) => setConfirmNewPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Repita o novo PIN"
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-cyan-400"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMsg(null);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={newPinInput.length < 4 || newPinInput !== confirmNewPinInput}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
              >
                Salvar & Entrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
