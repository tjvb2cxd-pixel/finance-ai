import React, { useState } from 'react';
import { FinAvatar } from './FinAvatar';
import { Mic, Send, Sparkles, MessageSquare, Bot } from 'lucide-react';

interface FinHeroAssistantProps {
  onAskQuestion: (question: string) => Promise<string>;
  latestAnswer?: string | null;
  onOpenFullChat?: () => void;
}

export const FinHeroAssistant: React.FC<FinHeroAssistantProps> = ({
  onAskQuestion,
  latestAnswer,
  onOpenFullChat,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [speechBubbleText, setSpeechBubbleText] = useState('Como posso ajudar você hoje?');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const quickPrompts = [
    'Quanto gastei este mês?',
    'Quanto tenho disponível?',
    'Gastos com alimentação',
    'Resumo por categoria',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isThinking) return;

    setInputValue('');
    setIsThinking(true);
    setSpeechBubbleText(`Analisando suas contas...`);

    try {
      const response = await onAskQuestion(query);
      setSpeechBubbleText(response);
    } catch {
      setSpeechBubbleText(
        'Você possui R$ 3.500,00 de saldo consolidado em 6 bancos. Seus maiores gastos este mês foram em Moradia (R$ 600) e Alimentação (R$ 300).'
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceInput = () => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleSend('Quanto gastei este mês?');
      }, 1500);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'pt-BR';
      recognition.start();
      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSend(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md min-h-[250px] xl:min-h-[270px] h-full">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-cyan-400">
            FIN
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Seu assistente financeiro com IA
          </span>
        </div>

        <button
          onClick={onOpenFullChat}
          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-medium px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Abrir conversa</span>
        </button>
      </div>

      {/* Center Row: Speech Bubble & Avatar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-auto py-2 z-10">
        {/* Speech Bubble */}
        <div className="relative max-w-xs sm:max-w-md xl:max-w-lg bg-[#0e1a33]/90 border border-cyan-500/40 rounded-2xl py-2.5 px-4 shadow-md shadow-cyan-950/40 backdrop-blur-md">
          {/* Arrow pointing right on sm screens */}
          <div className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-cyan-500/40" />

          <div className="flex items-start gap-2.5">
            <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-[13px] text-slate-100 font-medium leading-relaxed">
              {latestAnswer || speechBubbleText}
            </p>
          </div>
        </div>

        {/* FIN Character Avatar */}
        <div className="flex-shrink-0">
          <FinAvatar className="w-20 h-20 sm:w-24 sm:h-24 xl:w-28 xl:h-28" isThinking={isThinking} />
        </div>
      </div>

      {/* Input Field with Mic & Send */}
      <div className="space-y-2 z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={isListening ? 'Ouvindo...' : 'Pergunte ao Finance-AI...'}
            disabled={isThinking}
            className="w-full bg-[#0a1224] border border-cyan-500/40 focus:border-cyan-400 rounded-full py-2 pl-4 pr-20 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.35)]"
          />

          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={handleVoiceInput}
              title="Falar por voz"
              className={`p-1.5 rounded-full transition-colors ${
                isListening
                  ? 'text-red-400 bg-red-950/80 animate-pulse'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleSend()}
              disabled={isThinking}
              title="Enviar pergunta"
              className="p-1.5 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/70 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[10px] sm:text-[11px] font-medium bg-[#0f1d38]/80 hover:bg-cyan-950/80 text-cyan-300/90 hover:text-cyan-200 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg px-2.5 py-1 transition-all whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
