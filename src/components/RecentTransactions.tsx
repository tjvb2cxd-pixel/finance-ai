import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { ShoppingCart, Wallet, Car, Plus, Film, Tag } from 'lucide-react';

interface RecentTransactionsProps {
  isLoading?: boolean;
  transactions: Transaction[];
  onViewAll?: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  isLoading,
  transactions,
  onViewAll,
  onSelectTransaction,
}) => {
  const { formatValue } = usePrivacy();

  if (isLoading) {
    return (
      <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-md animate-pulse min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-32 bg-slate-800 rounded"></div>
          <div className="h-4 w-12 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-4 my-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-800"></div>
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-3 bg-slate-700/80 rounded"></div>
                  <div className="w-16 h-2 bg-slate-800 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-3 bg-slate-700/80 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getCategoryIcon = (categoryKey: string, title: string) => {
    if (title.toLowerCase().includes('netflix')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/50 flex items-center justify-center text-red-500 font-extrabold text-sm">
          N
        </div>
      );
    }

    switch (categoryKey) {
      case 'alimentacao':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        );
      case 'receita':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
        );
      case 'transporte':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-600/40 flex items-center justify-center text-blue-400">
            <Car className="w-4 h-4" />
          </div>
        );
      case 'saude':
        return (
          <div className="w-8 h-8 rounded-lg bg-pink-950/70 border border-pink-600/40 flex items-center justify-center text-pink-400">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
        );
      case 'lazer':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-950/70 border border-amber-600/40 flex items-center justify-center text-amber-400">
            <Film className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <Tag className="w-4 h-4" />
          </div>
        );
    }
  };

  const displayedTransactions = transactions.slice(0, 7);

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  // Staggered slide + fade item
  const itemVariants = {
    hidden: { opacity: 0, x: -14, y: 4 },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
    exit: { opacity: 0, x: 14, transition: { duration: 0.15 } },
  };

  return (
    <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-sm h-full min-h-[350px] xl:min-h-[390px] 2xl:min-h-[430px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Últimas Transações
          </h3>
          <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full font-mono">
            {transactions.length} registros
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          Ver todas
        </button>
      </div>

      {/* Transactions List with Staggered Fade-in & Slide Animation */}
      {displayedTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center my-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-200">Nenhum lançamento no momento</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed mx-auto">
              Extratos zerados e prontos. Importe seu arquivo PDF/OFX ou registre novas movimentações.
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      ) : (
        <motion.div
          key={displayedTransactions.map((t) => t.id).join('-')}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2 my-auto"
        >
          <AnimatePresence mode="popLayout">
            {displayedTransactions.map((tx) => {
              const isIncome = tx.type === 'income';

              return (
                <motion.div
                  key={tx.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ scale: 1.015, x: 2 }}
                  onClick={() => onSelectTransaction?.(tx)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 hover:brightness-110 hover:shadow-lg transition-colors duration-200 cursor-pointer group"
                >
                  {/* Left: Icon and info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getCategoryIcon(tx.categoryKey, tx.title)}
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                        {tx.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{tx.category}</p>
                    </div>
                  </div>

                  {/* Right: Amount and date */}
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className={`text-xs font-bold font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isIncome ? `+ ${formatValue(tx.amount)}` : `- ${formatValue(tx.amount)}`}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{tx.date}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Subtle indicator */}
      <div className="mt-3 pt-2.5 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sincronização em tempo real
        </span>
        <span className="text-slate-400 font-mono">{transactions.length} registros</span>
      </div>
    </div>
  );
};
