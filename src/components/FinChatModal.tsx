import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { FinAvatar } from './FinAvatar';
import { X, Send, Bot, User, Sparkles, Mic, Trash2 } from 'lucide-react';

interface FinChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory?: () => void;
}

export const FinChatModal: React.FC<FinChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onClearHistory,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    setLoading(true);
    try {
      await onSendMessage(text);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = async (prompt: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await onSendMessage(prompt);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#091122] border border-cyan-500/40 rounded-2xl w-full max-w-2xl h-[620px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#060b17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span className="text-cyan-400">FIN</span>
                <span>• Inteligência Financeira</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Conectado com Gemini 3.8 Flash & Open Finance Brasil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                title="Limpar histórico"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isFin = msg.sender === 'fin';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isFin ? 'justify-start' : 'justify-end'}`}
              >
                {isFin && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed ${
                    isFin
                      ? 'bg-[#0d1830] text-slate-100 border border-slate-700/70 shadow-md'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      isFin ? 'text-slate-500' : 'text-cyan-200'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {!isFin && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-[#0d1830] border border-slate-700/70 rounded-2xl p-3 text-xs text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>FIN está analisando suas métricas...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-[#060b17]/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            'Onde posso cortar gastos?',
            'Qual o saldo do Itaú e Bradesco?',
            'Como atingir minha meta de R$ 2.000?',
            'Fazer um resumo semanal',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleChipClick(prompt)}
              className="text-[11px] font-medium whitespace-nowrap bg-slate-800/80 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#060b17] border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Converse com FIN sobre suas finanças..."
            disabled={loading}
            className="flex-1 bg-[#091122] border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
