import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldAlert, X, Trash2, Unlink } from 'lucide-react';

export interface ConfirmDangerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  badgeText?: string;
  description?: string;
  itemPreview?: {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    tag?: string;
    tagColor?: string;
  };
  impactPoints?: string[];
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: 'danger' | 'warning';
  actionType?: 'delete' | 'disconnect';
  isLoading?: boolean;
}

export const ConfirmDangerModal: React.FC<ConfirmDangerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  badgeText = 'Atenção Necessária',
  description,
  itemPreview,
  impactPoints = [],
  confirmButtonText = 'Confirmar Exclusão',
  cancelButtonText = 'Cancelar e Voltar',
  variant = 'danger',
  actionType = 'delete',
  isLoading = false,
}) => {
  // ESC key listener to safely dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Dark Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-danger-title"
            aria-describedby="confirm-danger-desc"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md bg-[#0b1325] border border-red-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.15)] overflow-hidden z-10 flex flex-col"
          >
            {/* Ambient top red glow line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

            {/* Header Section */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDanger
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    }`}
                  >
                    {isDanger ? (
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border ${
                        isDanger
                          ? 'bg-red-950/60 text-red-300 border-red-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {badgeText}
                    </span>
                    <h2
                      id="confirm-danger-title"
                      className="text-lg font-bold text-white tracking-tight"
                    >
                      {title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-50"
                  aria-label="Fechar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {description && (
                <p
                  id="confirm-danger-desc"
                  className="mt-3 text-xs text-slate-300 leading-relaxed"
                >
                  {description}
                </p>
              )}

              {/* Target Item Highlight Card */}
              {itemPreview && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#060c18] border border-slate-800 flex items-center gap-3.5">
                  {itemPreview.icon && (
                    <div className="flex-shrink-0">{itemPreview.icon}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">
                        {itemPreview.title}
                      </h4>
                      {itemPreview.tag && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            itemPreview.tagColor ||
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {itemPreview.tag}
                        </span>
                      )}
                    </div>
                    {itemPreview.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {itemPreview.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Impact Consequences list */}
              {impactPoints.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/20 border border-red-500/20 space-y-2">
                  <p className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    Impactos desta ação:
                  </p>
                  <ul className="space-y-1.5">
                    {impactPoints.map((point, index) => (
                      <li
                        key={index}
                        className="text-[11px] text-slate-300 flex items-start gap-2 leading-tight"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-[#080e1d] border-t border-slate-800/80 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800/90 text-slate-300 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {cancelButtonText}
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                disabled={isLoading}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isDanger
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-950/50 hover:shadow-red-600/30'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/50'
                } disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]`}
              >
                {actionType === 'disconnect' ? (
                  <Unlink className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{isLoading ? 'Processando...' : confirmButtonText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
