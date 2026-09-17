import React, { useState, useEffect, useRef } from 'react';
import { FinancialSummary } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { CreditCard, TrendingUp, TrendingDown, Layers, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { AnimatedNumber } from './AnimatedNumber';

interface SummaryCardsProps { 
  isLoading?: boolean;
  summary: FinancialSummary;
  onChangePeriod?: (period: string) => void;
  onOpenAccounts?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  isLoading,
  summary,
  onChangePeriod,
  onOpenAccounts,
}) => {
  const { formatValue } = usePrivacy();

  const [selectedPeriod, setSelectedPeriod] = useState('Este mês');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const periods = ['Este mês', 'Mês anterior', 'Ano atual'];

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatSpokenCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    return formatted.replace('R$', '').trim() + ' reais';
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const net = summary.receitas - summary.despesas;
    const netStatusText =
      net >= 0
        ? `Você está com um superávit positivo de ${formatSpokenCurrency(net)}.`
        : `Você está com um déficit no período de ${formatSpokenCurrency(Math.abs(net))}.`;

    const speechText = `Aqui está o seu resumo financeiro para o período ${selectedPeriod}. ` +
      `Seu saldo total acumulado em contas é de ${formatSpokenCurrency(summary.saldoTotal)}. ` +
      (summary.saldoProjetado !== undefined ? `Seu saldo projetado após despesas pendentes é de ${formatSpokenCurrency(summary.saldoProjetado)}. ` : '') +
      `As receitas consolidadas somam ${formatSpokenCurrency(summary.receitas)}. ` +
      `As despesas registradas totalizam ${formatSpokenCurrency(summary.despesas)}. ` +
      `Você possui ${summary.contasConectadas} contas bancárias ativas e integradas. ` +
      `${netStatusText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best available Brazilian Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(
      (v) => (v.lang === 'pt-BR' || v.lang.startsWith('pt')) && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Daniel') || v.default)
    ) || voices.find((v) => v.lang === 'pt-BR' || v.lang.startsWith('pt'));

    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (

      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md animate-pulse min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-slate-800 rounded"></div>
          <div className="h-6 w-20 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 gap-3 my-auto">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800/40 rounded-xl p-3.5 flex flex-col gap-2 h-[72px]">
              <div className="flex justify-between">
                <div className="w-16 h-2 bg-slate-700/50 rounded"></div>
                <div className="w-5 h-5 bg-slate-700/50 rounded-lg"></div>
              </div>
              <div className="w-24 h-4 bg-slate-700/80 rounded mt-auto"></div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex justify-between border-t border-slate-800/60">
           <div className="w-20 h-2 bg-slate-800 rounded"></div>
           <div className="w-16 h-3 bg-slate-800 rounded"></div>
        </div>
      </div>

    );
  }

  return (
    <div className="bg-[#0b1325]/90 border border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md neon-pulse transition-all min-h-[250px] xl:min-h-[270px] h-full">
      {/* Subtle top neon ambient glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-16 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            Resumo Financeiro
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Speech Synthesis Button */}
          <Tooltip content={isSpeaking ? "Pausar leitura em áudio" : "Ouvir resumo financeiro por voz"}>
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400/40 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-cyan-300 border-slate-700/60'
              }`}
              aria-label="Ditar resumo financeiro"
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </Tooltip>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
            >
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-1.5 w-32 bg-[#0f172a] border border-slate-700 rounded-xl shadow-xl py-1 z-30">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPeriod(p);
                      setShowDropdown(false);
                      onChangePeriod?.(p);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      selectedPeriod === p
                        ? 'bg-cyan-500/20 text-cyan-400 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-auto">
        {/* SALDO TOTAL */}
        <div className="bg-[#081020]/90 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <Tooltip content="Soma de todos os saldos positivos e negativos">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase cursor-help border-b border-dashed border-slate-600 pb-0.5">
                Saldo Total
              </span>
            </Tooltip>
            <Tooltip content="Disponível em todas as contas conectadas" position="left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Tooltip>
          </div>
          <AnimatedNumber value={summary.saldoTotal} className="text-base sm:text-lg md:text-xl font-black text-cyan-400 font-mono tracking-tight" />
          {summary.saldoProjetado !== undefined && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Projetado:</span>
              <span
                className={`font-mono font-bold ${
                  summary.saldoProjetado < 0
                    ? 'text-rose-400'
                    : summary.saldoProjetado < summary.saldoTotal
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                }`}
              >
                {formatValue(summary.saldoProjetado)}
              </span>
            </div>
          )}
        </div>

        {/* RECEITAS */}
        <div className="bg-[#081020]/90 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <Tooltip content="Entradas confirmadas no período atual">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase cursor-help border-b border-dashed border-slate-600 pb-0.5">
                Receitas
              </span>
            </Tooltip>
            <Tooltip content="Ver relatórios de receitas" position="left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Tooltip>
          </div>
          <AnimatedNumber value={summary.receitas} className="text-base sm:text-lg md:text-xl font-black text-emerald-400 font-mono tracking-tight" />
        </div>

        {/* DESPESAS */}
        <div className="bg-[#081020]/90 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <Tooltip content="Saídas e pagamentos realizados">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase cursor-help border-b border-dashed border-slate-600 pb-0.5">
                Despesas
              </span>
            </Tooltip>
            <Tooltip content="Ver relatórios de despesas" position="left">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Tooltip>
          </div>
          <AnimatedNumber value={summary.despesas} className="text-base sm:text-lg md:text-xl font-black text-red-400 font-mono tracking-tight" />
        </div>

        {/* CONTAS */}
        <div
          onClick={onOpenAccounts}
          className="bg-[#081020]/90 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 uppercase group-hover:text-purple-300 transition-colors">
              Contas
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl font-black text-cyan-300 font-mono">
              {summary.contasConectadas}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Ativas
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-1.5 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <span>Balanço Líquido:</span>
          <span className={`font-mono font-bold ${summary.receitas - summary.despesas >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {summary.receitas - summary.despesas >= 0 ? '+ ' : '- '}
            {formatValue(Math.abs(summary.receitas - summary.despesas))}
          </span>
        </div>
        {summary.saldoProjetado !== undefined && (
          <div className="flex items-center gap-1.5">
            <span>Saldo Projetado:</span>
            <span
              className={`font-mono font-bold ${
                summary.saldoProjetado < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatValue(summary.saldoProjetado)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
