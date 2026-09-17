import React, { useState } from 'react';
import { BankSlug, Transaction } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { BankLogo } from './BankLogos';
import { Search, Filter, Plus, ArrowLeft, Tag, Mic, Upload, ChevronDown } from 'lucide-react';

interface FullTransactionsViewProps {
  transactions: Transaction[];
  onBackToOverview: () => void;
  onOpenNewTransaction: () => void;
  onOpenVoiceTransaction?: () => void;
  onOpenImportStatement?: () => void;
}

export const FullTransactionsView: React.FC<FullTransactionsViewProps> = ({
  transactions,
  onBackToOverview,
  onOpenNewTransaction,
  onOpenVoiceTransaction,
  onOpenImportStatement,
}) => {
  const { formatValue } = usePrivacy();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | 'month' | 'year'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  
  const allTags = Array.from(new Set(transactions.flatMap(tx => tx.tags || []))).sort();

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesBank = bankFilter === 'all' || tx.bankSlug === bankFilter;
    const matchesTag = tagFilter === 'all' || (tx.tags && tx.tags.includes(tagFilter));
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      // Reset hours to start of day for accurate day diffs
      now.setHours(0, 0, 0, 0);
      
      const txDateParts = tx.rawDate.split('-'); // YYYY-MM-DD
      const txDate = new Date(Number(txDateParts[0]), Number(txDateParts[1]) - 1, Number(txDateParts[2]));
      
      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = txDate >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'year') {
        matchesDate = txDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesBank && matchesDate && matchesTag;
  });

  const totalFilteredIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalFilteredExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const filteredNet = totalFilteredIncome - totalFilteredExpense;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 flex-1 flex flex-col justify-between min-h-[calc(100vh-230px)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Todas as Transações</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Extrato Geral
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extrato consolidado via importação de extratos PDF com conciliação inteligente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex items-center rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.35)] transition-all overflow-hidden p-0.5">
              <button
                onClick={onOpenNewTransaction}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 font-bold transition-colors text-white"
                title="Nova Transação Manual"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-white">Nova Transação</span>
              </button>

              <button
                onClick={() => setShowActionDropdown(!showActionDropdown)}
                className="p-2 border-l border-white/20 hover:bg-white/10 text-white transition-colors"
                title="Mais opções: Lançar por Voz ou Importar Extrato"
              >
                <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showActionDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-[#0b1325] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 text-xs">
                <button
                  onClick={() => {
                    setShowActionDropdown(false);
                    onOpenNewTransaction();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-semibold block text-white">Manual</span>
                    <span className="text-[10px] text-slate-400 block">Formulário completo</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowActionDropdown(false);
                    onOpenVoiceTransaction?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-semibold block text-white flex items-center gap-1">
                      Lançar por Voz
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-500/30">Voz</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block">Ditar com microfone</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowActionDropdown(false);
                    onOpenImportStatement?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-semibold block text-white flex items-center gap-1">
                      Importar Extrato
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-500/30">PDF • OFX</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block">Extrato em PDF, OFX ou CSV</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Ribbon of Filtered Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Lançamentos Filtrados
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg sm:text-2xl font-black text-white font-mono">{filtered.length}</span>
            <span className="text-[11px] text-slate-500">de {transactions.length} total</span>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Receitas Filtradas
          </span>
          <div className="mt-1">
            <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
              {formatValue(totalFilteredIncome)}
            </span>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Despesas Filtradas
          </span>
          <div className="mt-1">
            <span className="text-lg sm:text-2xl font-black text-rose-400 font-mono">
              {formatValue(totalFilteredExpense)}
            </span>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Resultado Líquido
          </span>
          <div className="mt-1">
            <span className={`text-lg sm:text-2xl font-black font-mono ${filteredNet >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {filteredNet >= 0 ? `+ ${formatValue(filteredNet)}` : `- ${formatValue(Math.abs(filteredNet))}`}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b1325]/90 border border-slate-800/80 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full bg-[#080e1c] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex bg-[#080e1c] p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-slate-700 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 bg-[#080e1c] border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">Todas as Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-[#080e1c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">Todo o período</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="month">Este mês</option>
            <option value="year">Ano atual</option>
          </select>

          {/* Bank filter */}
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="bg-[#080e1c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">Todos os Bancos</option>
            <option value="itau">Itaú</option>
            <option value="bradesco">Bradesco</option>
            <option value="santander-pf">Santander PF</option>
          </select>
        </div>
      </div>

      {/* Table Container - Expands to fill screen vertically */}
      <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col justify-between min-h-[420px] xl:min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080e1c] text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Transação</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Banco</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/60 hover:brightness-110 transition-all duration-200 cursor-pointer group">
                  <td className="py-3.5 px-4 font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {tx.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <BankLogo slug={tx.bankSlug} size={22} className="w-5.5 h-5.5 rounded-md" />
                      <span className="text-slate-300 font-medium">{tx.bankName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                    <span
                      className={
                        tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }
                    >
                      {tx.type === 'income'
                        ? `+ ${formatValue(tx.amount)}`
                        : `- ${formatValue(tx.amount)}`}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-bold text-sm text-slate-300">Nenhuma transação encontrada</p>
                      <p className="text-xs text-slate-500">
                        Não encontramos lançamentos correspondentes aos filtros selecionados. Experimente alterar ou limpar a busca.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3.5 sm:p-4 bg-[#080e1c]/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Exibindo {filtered.length} de {transactions.length} movimentações</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Sincronização contínua ativada
          </span>
        </div>
      </div>
    </div>
  );
};
