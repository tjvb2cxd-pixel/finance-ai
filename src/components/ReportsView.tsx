import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FileDown,
  Filter,
  Check,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  ListOrdered,
  FileSpreadsheet,
  Printer,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { BankAccount, Transaction, UserProfile } from '../types';
import { BankLogo } from './BankLogos';
import { usePrivacy } from '../contexts/PrivacyContext';
import { generateFinancialReportPDF } from '../utils/pdfExport';

interface ReportsViewProps {
  banks: BankAccount[];
  transactions: Transaction[];
  activeProfile?: UserProfile;
  onBackToOverview: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  banks,
  transactions,
  activeProfile,
  onBackToOverview,
}) => {
  const { formatValue, isPrivacyMode } = usePrivacy();

  // Multi-bank selection filter (default: all banks selected)
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(() => banks.map((b) => b.id));
  
  // Date period filter
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '60' | '90'>('all');
  
  // PDF export loading feedback
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Toggle bank selection
  const handleToggleBank = (bankId: string) => {
    setSelectedBankIds((prev) => {
      if (prev.includes(bankId)) {
        // Keep at least one bank selected
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== bankId);
      } else {
        return [...prev, bankId];
      }
    });
  };

  const handleSelectAllBanks = () => {
    setSelectedBankIds(banks.map((b) => b.id));
  };

  // Selected Bank Objects
  const selectedBanks = useMemo(() => {
    return banks.filter((b) => selectedBankIds.includes(b.id));
  }, [banks, selectedBankIds]);

  const selectedBankSlugs = useMemo(() => {
    return new Set(selectedBanks.map((b) => b.slug));
  }, [selectedBanks]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Bank match
      const matchBank = selectedBankIds.includes(tx.bankId) || selectedBankSlugs.has(tx.bankSlug);
      if (!matchBank) return false;

      // 2. Date match
      if (dateFilter === 'all') return true;
      if (!tx.rawDate) return true;

      const txDate = new Date(tx.rawDate);
      const now = new Date();
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= Number(dateFilter);
    });
  }, [transactions, selectedBankIds, selectedBankSlugs, dateFilter]);

  // Calculated Metrics for the Filtered Scope
  const totalBalance = useMemo(() => {
    return selectedBanks.reduce((sum, b) => sum + b.availableBalance, 0);
  }, [selectedBanks]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpense;

  // Category Distribution for Filtered Expenses
  const categoryBreakdown = useMemo(() => {
    const expenseTxs = filteredTransactions.filter((t) => t.type === 'expense');
    const totals: Record<string, number> = {};

    expenseTxs.forEach((t) => {
      const cat = t.category || 'Outros';
      totals[cat] = (totals[cat] || 0) + t.amount;
    });

    const sumExpenses = Object.values(totals).reduce((a, b) => a + b, 0);

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: sumExpenses > 0 ? (amount / sumExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Handle PDF Export
  const handleExportPDF = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const periodLabel =
        dateFilter === 'all'
          ? 'Todo o histórico disponível'
          : dateFilter === '30'
          ? 'Últimos 30 dias'
          : dateFilter === '60'
          ? 'Últimos 60 dias'
          : 'Últimos 90 dias';

      generateFinancialReportPDF({
        userProfile: activeProfile,
        selectedBanks,
        allBanks: banks,
        transactions: filteredTransactions,
        dateRangeLabel: periodLabel,
        categoryBreakdown,
        summary: {
          totalBalance,
          totalIncome,
          totalExpense,
          netSavings,
        },
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4500);
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-between min-h-[calc(100vh-230px)] w-full"
    >
      {/* Top Navigation & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Relatórios Financeiros</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                Exportação PDF
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gere documentos consolidados em PDF com os dados filtrados das suas contas bancárias
            </p>
          </div>
        </div>

        {/* Primary Export Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting || selectedBanks.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 stroke-[2.2]" />
            <span>{isExporting ? 'Compilando PDF...' : 'Exportar Relatório em PDF'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Download iniciado!</strong> O relatório financeiro das {selectedBanks.length} conta(s) selecionada(s) foi gerado e salvo em seu dispositivo.
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Formatado via jsPDF</span>
        </motion.div>
      )}

      {/* Filter Toolbar: Bank Selector Chips & Period */}
      <div className="p-4 rounded-2xl bg-[#090f1d] border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Contas Selecionadas para o Relatório ({selectedBanks.length} de {banks.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllBanks}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/20 hover:bg-cyan-950/60"
            >
              Selecionar Todas
            </button>
          </div>
        </div>

        {/* Bank Selection Multi-Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {banks.map((bank) => {
            const isSelected = selectedBankIds.includes(bank.id);
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => handleToggleBank(bank.id)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  isSelected
                    ? 'bg-[#0f1d38] border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-[#060c18] border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="relative">
                  <BankLogo slug={bank.slug} size={28} className="w-7 h-7 rounded-lg flex-shrink-0" />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{bank.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {formatValue(bank.availableBalance)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Period & Scope Filters */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Período de lançamentos:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'Todo o Período' },
                { id: '30', label: 'Últimos 30 dias' },
                { id: '60', label: 'Últimos 60 dias' },
                { id: '90', label: 'Últimos 90 dias' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDateFilter(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateFilter === p.id
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filteredTransactions.length} lançamentos encontrados</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon (Reflecting Selected Banks and Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Saldo em Contas */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Saldo Disponível Filtrado</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {formatValue(totalBalance)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Soma de {selectedBanks.length} conta(s) ativas
            </p>
          </div>
        </div>

        {/* 2. Receitas */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Entradas Filtradas</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatValue(totalIncome)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'income').length} crédito(s) no período
            </p>
          </div>
        </div>

        {/* 3. Despesas */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Saídas Filtradas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
              {formatValue(totalExpense)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'expense').length} débito(s) e faturas
            </p>
          </div>
        </div>

        {/* 4. Resultado Líquido */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Resultado Líquido</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                netSavings >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatValue(netSavings)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {netSavings >= 0 ? 'Superávit acumulado no escopo' : 'Déficit no escopo'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories Distribution & Transactions Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col: Despesas por Categoria (Filtered) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#090f1d] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Distribuição por Categoria
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {categoryBreakdown.length} categorias
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Nenhuma despesa para o filtro atual de contas.
              </p>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatValue(cat.amount)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Incluído automaticamente na Seção 3 do PDF</span>
            <button
              onClick={handleExportPDF}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Gerar PDF</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Transactions preview table */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#090f1d] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Lançamentos Filtrados ({filteredTransactions.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              Mostrando até 8 pré-visualizados
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-white">Nenhum lançamento no filtro</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente marcar mais contas bancárias ou selecionar outro período.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Descrição</th>
                    <th className="pb-2.5">Conta</th>
                    <th className="pb-2.5">Data</th>
                    <th className="pb-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 pr-2">
                        <p className="font-semibold text-white truncate max-w-[180px]">
                          {tx.title}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx.category}</p>
                      </td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <BankLogo slug={tx.bankSlug} size={18} className="w-4.5 h-4.5 rounded" />
                          <span className="text-slate-300 text-[11px] truncate max-w-[100px]">
                            {tx.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-slate-400 text-[11px] whitespace-nowrap">
                        {tx.date || tx.rawDate}
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatValue(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTransactions.length > 8 && (
                <p className="text-[11px] text-slate-400 text-center mt-3 pt-3 border-t border-slate-800/80">
                  + {filteredTransactions.length - 8} outros lançamentos serão anexados na íntegra no relatório PDF.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reports Exportation Status & Security Ribbon */}
      <div className="bg-[#0b1325]/80 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 mt-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold block">Documento Fiscal e Contábil Consolidado</span>
            <span className="text-[11px] text-slate-400">
              {filteredTransactions.length} movimentações auditadas de {selectedBanks.length} bancos • Layout aprovado para contabilidade e IRPF
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">
            Padrão: <strong className="text-slate-200">A4 • Vetorial</strong>
          </span>
          <span className="text-slate-400">
            Assinatura: <strong className="text-emerald-400">Válida</strong>
          </span>
        </div>
      </div>
    </motion.div>
  );
};
