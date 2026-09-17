import React, { useState } from 'react';
import { BankAccount, CategoryKey, Transaction } from '../types';
import { X, PlusCircle, ArrowUpRight, ArrowDownRight, Tag, Mic, Upload, Sparkles, FileText } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: BankAccount[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onOpenVoiceModal?: () => void;
  onOpenImportModal?: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  banks,
  onAddTransaction,
  onOpenVoiceModal,
  onOpenImportModal,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('alimentacao');
  const [bankId, setBankId] = useState(banks[0]?.id || 'bank-itau');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isListeningQuick, setIsListeningQuick] = useState(false);

  if (!isOpen) return null;

  const categoryOptions: { key: CategoryKey; label: string }[] = [
    { key: 'moradia', label: 'Moradia' },
    { key: 'alimentacao', label: 'Alimentação' },
    { key: 'transporte', label: 'Transporte' },
    { key: 'lazer', label: 'Lazer' },
    { key: 'saude', label: 'Saúde' },
    { key: 'outros', label: 'Outros' },
    { key: 'receita', label: 'Receita / Salário' },
    { key: 'investimento', label: 'Investimento' },
  ];

  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagsInput.trim())) {
        setTags([...tags, tagsInput.trim()]);
      }
      setTagsInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const selectedBank = banks.find((b) => b.id === bankId) || banks[0];
    const categoryName = categoryOptions.find((c) => c.key === categoryKey)?.label || 'Geral';

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    onAddTransaction({
      title: title.trim(),
      amount: numAmount,
      type,
      category: categoryName,
      categoryKey,
      date: dateStr,
      rawDate: now.toISOString().split('T')[0],
      bankId: selectedBank.id,
      bankName: selectedBank.name,
      bankSlug: selectedBank.slug,
      tags,
    });

    onClose();
  };

  const handleQuickDictate = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithSpeech = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SpeechClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechClass) {
      if (onOpenVoiceModal) {
        onClose();
        onOpenVoiceModal();
      }
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      setIsListeningQuick(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setTitle(text);
          const numMatch = text.match(/(?:r\$|reais)?\s*(\d+(?:[.,]\d{1,2})?)/i);
          if (numMatch && !amount) {
            setAmount(numMatch[1].replace(',', '.'));
          }
        }
        setIsListeningQuick(false);
      };
      rec.onerror = () => setIsListeningQuick(false);
      rec.onend = () => setIsListeningQuick(false);
      rec.start();
    } catch {
      setIsListeningQuick(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1325] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Nova Transação</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Modes Switcher */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[#060b16] border-b border-slate-800 text-[11px]">
          <button
            type="button"
            className="py-1.5 px-2 rounded-lg font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Manual</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVoiceModal?.();
            }}
            className="py-1.5 px-2 rounded-lg font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 flex items-center justify-center gap-1.5 transition-all"
          >
            <Mic className="w-3 h-3 text-cyan-400" />
            <span>Por Voz</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenImportModal?.();
            }}
            className="py-1.5 px-2 rounded-lg font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 flex items-center justify-center gap-1.5 transition-all group"
            title="Importar extrato em PDF, OFX ou CSV"
          >
            <FileText className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Extrato (PDF/OFX)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick PDF statement prompt banner */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/60 border border-cyan-500/20 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
                  Importar Extrato em PDF
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    IA
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Envie o PDF do seu banco para lançar tudo de uma vez
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenImportModal?.();
              }}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black whitespace-nowrap shadow-sm transition-all flex-shrink-0"
            >
              Subir PDF
            </button>
          </div>

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (categoryKey === 'receita') setCategoryKey('alimentacao');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-red-950/80 text-red-400 border border-red-700/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryKey('receita');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Receita / Entrada</span>
            </button>
          </div>

          {/* Description with Voice Dictation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Descrição
              </label>
              <button
                type="button"
                onClick={handleQuickDictate}
                className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                  isListeningQuick
                    ? 'text-cyan-400 animate-pulse'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                title="Ditar descrição por voz"
              >
                <Mic className="w-3 h-3" />
                <span>{isListeningQuick ? 'Ouvindo...' : 'Ditar'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Padaria, Salário, Uber, PIX..."
                className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none pr-9"
              />
              <button
                type="button"
                onClick={handleQuickDictate}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Ditar por voz"
              >
                <Mic className={`w-3.5 h-3.5 ${isListeningQuick ? 'text-cyan-400 animate-pulse' : ''}`} />
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono font-bold outline-none"
            />
          </div>

          {/* Bank Account */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Conta Bancária
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: R$ {b.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          {type === 'expense' && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Categoria
              </label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value as CategoryKey)}
                className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                {categoryOptions
                  .filter((c) => c.key !== 'receita')
                  .map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)] transition-all"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
