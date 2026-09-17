import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FileText, CreditCard } from 'lucide-react';
import { BankSlug } from '../types';
import { BankLogo } from './BankLogos';
import { Bill } from './AlertsView';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
}

const AVAILABLE_BANKS: { slug: BankSlug; name: string }[] = [
  { slug: 'itau', name: 'Itaú' },
  { slug: 'bradesco', name: 'Bradesco' },
  { slug: 'santander-pf', name: 'Santander PF' },
];

export const NewBillModal: React.FC<NewBillModalProps> = ({ isOpen, onClose, onAddBill }) => {
  const [type, setType] = useState<'cartao' | 'boleto'>('boleto');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [bankSlug, setBankSlug] = useState<BankSlug>('itau');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !amount || !dueDate) return;

    onAddBill({
      title,
      type,
      amount: parseFloat(amount.replace(',', '.')),
      dueDate,
      ...(type === 'boleto' ? { barcode } : { bankSlug }),
    });

    // Reset
    setTitle('');
    setAmount('');
    setDueDate('');
    setBarcode('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0b1325] border border-slate-700/60 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Novo Vencimento
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('boleto')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                  type === 'boleto' 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Boleto</span>
              </button>
              <button
                type="button"
                onClick={() => setType('cartao')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                  type === 'cartao' 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Cartão</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Ex: Conta de Luz"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Vencimento</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {type === 'boleto' ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Código de Barras (Opcional)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
                  placeholder="00000.00000 00000.00000..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Instituição</label>
                <select
                  value={bankSlug}
                  onChange={(e) => setBankSlug(e.target.value as BankSlug)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                >
                  {AVAILABLE_BANKS.map((bank) => (
                    <option key={bank.slug} value={bank.slug} className="bg-slate-800">
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-colors mt-2"
            >
              Adicionar Vencimento
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
