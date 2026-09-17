import React, { useState, useEffect } from 'react';
import { BankAccount } from '../types';
import { BankLogo } from './BankLogos';
import { usePrivacy } from '../contexts/PrivacyContext';
import { X, Check, DollarSign, Wallet } from 'lucide-react';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankAccount | null;
  onSaveBalance: (bankId: string, newBalance: number) => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  bank,
  onSaveBalance,
}) => {
  const { formatValue } = usePrivacy();
  const [balanceInput, setBalanceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bank) {
      setBalanceInput(bank.availableBalance.toFixed(2).replace('.', ','));
      setError(null);
    }
  }, [bank, isOpen]);

  if (!isOpen || !bank) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = balanceInput.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);

    if (isNaN(parsed) || parsed < 0) {
      setError('Por favor, informe um valor numérico válido.');
      return;
    }

    onSaveBalance(bank.id, parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1325] border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>Ajustar Saldo Bancário</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bank Header Info */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <BankLogo slug={bank.slug} size={32} className="rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white uppercase truncate">{bank.name}</h3>
              <p className="text-[11px] text-slate-400">
                Saldo atual: <span className="font-mono text-cyan-400 font-bold">{formatValue(bank.availableBalance)}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              Novo Saldo Disponível (R$)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-xs pointer-events-none">
                R$
              </div>
              <input
                type="text"
                autoFocus
                value={balanceInput}
                onChange={(e) => {
                  setBalanceInput(e.target.value);
                  setError(null);
                }}
                placeholder="0,00"
                className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-cyan-300 font-mono font-bold outline-none placeholder:text-slate-600 transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              O novo saldo será gravado em tempo real no banco de dados e sincronizado com todos os dispositivos.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.35)] transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Saldo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
