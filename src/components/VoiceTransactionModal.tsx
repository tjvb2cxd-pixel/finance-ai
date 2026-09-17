import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Volume2,
  HelpCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { BankAccount, CategoryKey, Transaction } from '../types';
import { BankLogo } from './BankLogos';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: BankAccount[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

interface ParsedVoiceData {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryKey: CategoryKey;
  bankId: string;
  confidence: number;
}

const CATEGORY_NAMES: Record<CategoryKey, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  lazer: 'Lazer',
  saude: 'Saúde',
  outros: 'Outros',
  receita: 'Receita / Salário',
  investimento: 'Investimento',
};

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  isOpen,
  onClose,
  banks,
  onAddTransaction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsed Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('alimentacao');
  const [bankId, setBankId] = useState(banks[0]?.id || 'bank-itau');
  const [hasParsed, setHasParsed] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const samplePrompts = [
    'Almoço 42 reais no Itaú',
    'Mercado 185 no Bradesco',
    'Recebi 4200 de salário no Itaú',
    'Uber 26 reais transporte no Santander',
    'Farmácia 65 reais saúde no Bradesco',
  ];

  // Initialize SpeechRecognition on mount or when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsListening(false);
      setTranscript('');
      setErrorMessage(null);
      setHasParsed(false);
      return;
    }

    // Check browser support
    const windowWithSpeech = window as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      SpeechRecognition?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webkitSpeechRecognition?: any;
    };

    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          parseVoiceCommand(currentTranscript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permissão do microfone negada. Você pode digitar ou usar um exemplo.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Aviso: ${event.error}. Use os botões de exemplo para testar.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMessage('Navegador sem suporte direto à Web Speech API. Use os comandos rápidos abaixo.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [isOpen]);

  // Natural Language Parser for Brazilian Portuguese
  const parseVoiceCommand = (text: string) => {
    const raw = text.toLowerCase().trim();
    if (!raw) return;

    // 1. Detect Type
    const incomeKeywords = [
      'recebi',
      'recebido',
      'receita',
      'salário',
      'salario',
      'ganhei',
      'depósito',
      'deposito',
      'entrada',
      'pix recebido',
      'freela',
      'rendimento',
    ];
    const isIncome = incomeKeywords.some((w) => raw.includes(w));
    const detectedType: 'income' | 'expense' = isIncome ? 'income' : 'expense';

    // 2. Detect Amount
    let detectedAmount = 0;
    // Matches formats like "R$ 50", "50 reais", "50,90", "50.90", "1500"
    const amountMatch =
      raw.match(/(?:r\$|reais)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i) ||
      raw.match(/(\d+)\s*mil/i);

    if (amountMatch) {
      if (raw.includes('mil')) {
        const base = parseFloat(amountMatch[1].replace(',', '.'));
        detectedAmount = base * 1000;
      } else {
        detectedAmount = parseFloat(amountMatch[1].replace(',', '.'));
      }
    }

    // 3. Detect Bank
    let detectedBankId = banks[0]?.id || 'bank-itau';
    for (const b of banks) {
      const name = b.name.toLowerCase();
      const slug = b.slug.toLowerCase();
      if (
        raw.includes(name) ||
        raw.includes(slug) ||
        (slug.includes('itau') && (raw.includes('itaú') || raw.includes('itau'))) ||
        (slug.includes('bradesco') && raw.includes('bradesco')) ||
        (slug.includes('santander') && raw.includes('santander'))
      ) {
        detectedBankId = b.id;
        break;
      }
    }

    // 4. Detect Category
    let detectedCategory: CategoryKey = isIncome ? 'receita' : 'outros';
    if (!isIncome) {
      if (/mercado|supermercado|almoço|almoco|jantar|restaurante|comida|padaria|lanche|ifood|cafe|café|pizza|churrasco/i.test(raw)) {
        detectedCategory = 'alimentacao';
      } else if (/uber|99|táxi|taxi|gasolina|posto|combustível|combustivel|estacionamento|pedágio|pedagio|onibus|ônibus|metrô|metro/i.test(raw)) {
        detectedCategory = 'transporte';
      } else if (/aluguel|condomínio|condominio|luz|energia|água|agua|enel|sabesp|internet|iptu/i.test(raw)) {
        detectedCategory = 'moradia';
      } else if (/cinema|show|netflix|spotify|jogo|viagem|passeio|bar|cerveja|festa|livro/i.test(raw)) {
        detectedCategory = 'lazer';
      } else if (/farmácia|farmacia|remédio|remedio|médico|medico|hospital|consulta|exame|dentista/i.test(raw)) {
        detectedCategory = 'saude';
      } else if (/investimento|ações|acoes|cripto|fundo|cdb|tesouro/i.test(raw)) {
        detectedCategory = 'investimento';
      }
    }

    // 5. Clean Title
    let cleanTitle = text
      .replace(/(?:r\$|reais|real|\d+(?:[.,]\d{1,2})?)/gi, '')
      .replace(/\b(gastei|comprei|paguei|recebi|no|na|de|com|para|em|banco|conta|itau|itaú|bradesco|santander)\b/gi, '')
      .trim();

    // Capitalize first letter
    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    } else {
      cleanTitle = isIncome ? 'Receita Diversa' : 'Despesa por Voz';
    }

    // Update state
    setTitle(cleanTitle);
    setAmount(detectedAmount > 0 ? detectedAmount.toString() : '');
    setType(detectedType);
    setCategoryKey(detectedCategory);
    setBankId(detectedBankId);
    setHasParsed(true);
  };

  const startListening = () => {
    setErrorMessage(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch {}
        }, 200);
      }
    } else {
      // Simulate quick test
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        setTranscript(randomPrompt);
        parseVoiceCommand(randomPrompt);
      }, 1200);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    if (transcript) {
      parseVoiceCommand(transcript);
    }
  };

  const handleApplySample = (sample: string) => {
    setTranscript(sample);
    parseVoiceCommand(sample);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const selectedBank = banks.find((b) => b.id === bankId) || banks[0];
    const categoryName = CATEGORY_NAMES[categoryKey] || 'Geral';

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
      tags: ['comando-voz'],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0b1325] border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Lançar Transação por Voz</span>
                <span className="text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  Auto-detecção
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Fale naturalmente ou clique nos exemplos para preencher instantaneamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Voice Capture Hero Area */}
        <div className="p-6 bg-gradient-to-b from-[#091122] to-[#070d1a] border-b border-slate-800/80 flex flex-col items-center text-center">
          {/* Pulsing Mic Button */}
          <div className="relative mb-3">
            {isListening && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border border-cyan-400/60 pointer-events-none"
                />
              </>
            )}

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-cyan-500/50 scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50'
              }`}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 animate-pulse text-white" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-300">
            {isListening ? (
              <span className="text-cyan-400 animate-pulse font-bold">
                Ouvindo... Diga a despesa, valor e banco
              </span>
            ) : (
              'Clique no microfone para falar'
            )}
          </p>

          {/* Live Transcript Display */}
          <div className="w-full mt-3 min-h-[44px] p-2.5 rounded-xl bg-[#060b16] border border-slate-800/90 text-xs text-slate-200 font-medium flex items-center justify-center text-center">
            {transcript ? (
              <span className="italic text-cyan-300">"{transcript}"</span>
            ) : (
              <span className="text-slate-500">
                Exemplo: "Gastei 45 reais no almoço com C6" ou "Recebi 3500 de salário no Itaú"
              </span>
            )}
          </div>

          {errorMessage && (
            <p className="text-[11px] text-amber-400/90 mt-2">{errorMessage}</p>
          )}

          {/* Sample Chips for 1-Click Test */}
          <div className="w-full mt-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">
              Testar com exemplos prontos:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(s)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editable Extracted Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 bg-[#0b1325]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dados Detectados (Revise antes de salvar)</span>
            </span>
            {hasParsed && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Preenchimento Automático
              </span>
            )}
          </div>

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (categoryKey === 'receita') setCategoryKey('alimentacao');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Receita / Entrada</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Description */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Almoço, Padaria..."
                className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    {b.name} (R$ {b.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Categoria
              </label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value as CategoryKey)}
                className="w-full bg-[#080e1c] border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setTitle('');
                setAmount('');
                setHasParsed(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!title || !amount}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar e Lançar</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
