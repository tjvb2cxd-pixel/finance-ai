import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  Repeat,
  DollarSign,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Check,
  Building2,
  Sparkles,
  PieChart,
  Wallet,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import { Transaction, BankAccount, BankSlug, FixedExpenseItem } from '../types';
import { BankLogo } from './BankLogos';
import { usePrivacy } from '../contexts/PrivacyContext';

export type { FixedExpenseItem };

const INITIAL_FIXED_EXPENSES: FixedExpenseItem[] = [];

const CATEGORIES = [
  'Moradia',
  'Educação',
  'Saúde',
  'Transporte',
  'Assinaturas & Lazer',
  'Serviços',
  'Alimentação',
  'Outros',
];

const LOCAL_FIXED_KEY = 'finance_fixed_expenses_v2';

interface FixedExpensesViewProps {
  onBackToOverview: () => void;
  banks?: BankAccount[];
  expenses?: FixedExpenseItem[];
  onUpdateExpenses?: (newExpenses: FixedExpenseItem[] | ((prev: FixedExpenseItem[]) => FixedExpenseItem[])) => void;
  onCreateExpense?: (newItem: FixedExpenseItem) => void;
  onDeleteExpense?: (id: string) => void;
  onToggleStatus?: (id: string, newStatus: 'paid' | 'pending') => void;
}

export const FixedExpensesView: React.FC<FixedExpensesViewProps> = ({
  onBackToOverview,
  banks = [],
  expenses: propsExpenses,
  onUpdateExpenses: propsOnUpdateExpenses,
  onCreateExpense: propsOnCreateExpense,
  onDeleteExpense: propsOnDeleteExpense,
  onToggleStatus: propsOnToggleStatus,
}) => {
  const { formatValue } = usePrivacy();

  const [localExpenses, setLocalExpenses] = useState<FixedExpenseItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_FIXED_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_FIXED_EXPENSES;
  });

  const expenses = propsExpenses !== undefined ? propsExpenses : localExpenses;

  const updateExpenses = (newExpenses: FixedExpenseItem[] | ((prev: FixedExpenseItem[]) => FixedExpenseItem[])) => {
    if (propsOnUpdateExpenses) {
      propsOnUpdateExpenses(newExpenses);
    } else {
      setLocalExpenses((prev) => {
        const updated = typeof newExpenses === 'function' ? newExpenses(prev) : newExpenses;
        try {
          localStorage.setItem(LOCAL_FIXED_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for New Fixed Expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newDueDay, setNewDueDay] = useState('10');
  const [newBankSlug, setNewBankSlug] = useState<BankSlug>('itau');
  const [newBarcode, setNewBarcode] = useState('');
  const [newAutoDebit, setNewAutoDebit] = useState(false);

  // Metrics Calculations
  const totalFixedAmount = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const paidFixedAmount = useMemo(() => {
    return expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const pendingFixedAmount = useMemo(() => {
    return expenses
      .filter((e) => e.status !== 'paid')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const percentagePaid = totalFixedAmount > 0 ? (paidFixedAmount / totalFixedAmount) * 100 : 0;

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        if (filterCategory !== 'all' && item.category !== filterCategory) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            (item.bankName && item.bankName.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.dueDay - b.dueDay);
  }, [expenses, filterCategory, filterStatus, searchQuery]);

  const handleToggleStatus = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    const nextStatus = item?.status === 'paid' ? 'pending' : 'paid';
    if (propsOnToggleStatus) {
      propsOnToggleStatus(id, nextStatus);
    } else {
      updateExpenses((prev) =>
        prev.map((it) => {
          if (it.id === id) {
            return {
              ...it,
              status: nextStatus,
            };
          }
          return it;
        })
      );
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (propsOnDeleteExpense) {
      propsOnDeleteExpense(id);
    } else {
      updateExpenses((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleCopyBarcode = (barcode: string, id: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const parsedAmount = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const selectedBank = banks.find((b) => b.slug === newBankSlug);

    const newItem: FixedExpenseItem = {
      id: `fix-${Date.now()}`,
      title: newTitle.trim(),
      amount: parsedAmount,
      category: newCategory,
      dueDay: parseInt(newDueDay, 10) || 10,
      frequency: 'monthly',
      status: 'pending',
      bankSlug: newBankSlug,
      bankName: selectedBank ? selectedBank.name : 'Conta Padrão',
      barcode: newBarcode.trim() || undefined,
      autoDebit: newAutoDebit,
    };

    if (propsOnCreateExpense) {
      propsOnCreateExpense(newItem);
    } else {
      updateExpenses((prev) => [...prev, newItem]);
    }

    // Reset
    setNewTitle('');
    setNewAmount('');
    setNewBarcode('');
    setNewAutoDebit(false);
    setIsModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-between min-h-[calc(100vh-230px)] w-full"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Voltar à Visão Geral"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Despesas Fixas</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                Recorrentes Mensais
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Controle contas fixas, assinaturas e boletos mensais com vencimento programado
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Despesa Fixa</span>
        </button>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Comprometido */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fixo Comprometido</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {formatValue(totalFixedAmount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {expenses.length} compromissos cadastrados no mês
            </p>
          </div>
        </div>

        {/* Já Pago */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Já Liquidado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatValue(paidFixedAmount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {percentagePaid.toFixed(0)}% do montante mensal liquidado
            </p>
          </div>
        </div>

        {/* Pendente de Pagamento */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendente de Pagamento</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
              {formatValue(pendingFixedAmount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {expenses.filter((e) => e.status !== 'paid').length} conta(s) a pagar
            </p>
          </div>
        </div>

        {/* Débito Automático */}
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Em Débito Automático</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Repeat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-blue-400 font-mono tracking-tight">
              {formatValue(
                expenses
                  .filter((e) => e.autoDebit)
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {expenses.filter((e) => e.autoDebit).length} serviços com débito direto em conta
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar of Monthly Fixed Expenses */}
      <div className="p-4 rounded-2xl bg-[#090f1d] border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Progresso de Quitação das Contas Fixas</span>
          <span className="font-mono text-cyan-400 font-bold">
            {percentagePaid.toFixed(1)}% liquidado
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentagePaid, 100)}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090f1d] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria ou banco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Status:</span>
          {(['all', 'pending', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === st
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === 'all' ? 'Todas' : st === 'pending' ? 'Pendentes' : 'Pagas'}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#060c18] border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todas as Categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Cards / Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <AnimatePresence mode="popLayout">
          {filteredExpenses.map((expense) => {
            const isPaid = expense.status === 'paid';
            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPaid
                    ? 'bg-[#090f1d]/70 border-slate-800/80 opacity-85'
                    : 'bg-[#090f1d] border-slate-800 shadow-md hover:border-cyan-500/40'
                }`}
              >
                <div>
                  {/* Top row: Title, Bank and Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {expense.bankSlug && (
                        <BankLogo
                          slug={expense.bankSlug}
                          size={24}
                          className="w-6 h-6 rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isPaid ? 'text-slate-300 line-through' : 'text-white'
                          }`}
                        >
                          {expense.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {expense.category} • {expense.bankName || 'Conta Padrão'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(expense.id)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 transition-all ${
                        isPaid
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
                      }`}
                      title="Clique para alternar o status"
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Paga</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Value and Due Date */}
                  <div className="flex items-baseline justify-between py-2 border-y border-slate-800/70 my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vencimento mensal</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                        <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Todo dia {expense.dueDay}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Valor mensal</span>
                      <span className="text-base font-black text-white font-mono">
                        {formatValue(expense.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Auto debit */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {expense.autoDebit ? (
                      <span className="px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Repeat className="w-2.5 h-2.5 text-blue-400" />
                        Débito Automático
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        Boleto / Pix
                      </span>
                    )}

                    {expense.barcode && (
                      <button
                        onClick={() => handleCopyBarcode(expense.barcode!, expense.id)}
                        className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center gap-1 transition-colors"
                        title="Copiar código de barras"
                      >
                        {copiedId === expense.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                            <span>Copiar Linha</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/60 text-xs">
                  <button
                    onClick={() => handleToggleStatus(expense.id)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {isPaid ? 'Marcar como Pendente' : 'Marcar como Paga'}
                  </button>

                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Excluir despesa fixa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredExpenses.length === 0 && (
        <div className="text-center py-12 p-6 rounded-2xl bg-[#090f1d] border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-white">Nenhuma despesa fixa cadastrada</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Você ainda não possui despesas fixas cadastradas. Adicione contas recorrentes como aluguel, luz, internet, assinaturas e mensalidades.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Despesa Fixa</span>
          </button>
        </div>
      )}

      {/* Footer Metrics & Smart Projection Ribbon */}
      <div className="bg-[#0b1325]/80 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 mt-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold block">Previsão Orçamentária</span>
            <span className="text-[11px] text-slate-400">
              {expenses.filter(e => e.status === 'paid').length} de {expenses.length} contas liquidadas ({percentagePaid.toFixed(0)}%) • Restante previsto: <strong className="text-amber-400 font-mono">{formatValue(pendingFixedAmount)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">
            Débito em conta: <strong className="text-blue-400">{expenses.filter(e => e.autoDebit).length}</strong>
          </span>
          <span className="text-slate-400">
            Vencimentos: <strong className="text-slate-200">Dias 01 a 28</strong>
          </span>
        </div>
      </div>

      {/* Modal: Adicionar Nova Despesa Fixa */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0b1325] border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Cadastrar Despesa Fixa</h3>
                    <p className="text-[11px] text-slate-400">Compromisso financeiro mensal recorrente</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateFixedExpense} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome da Despesa / Serviço
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aluguel, Plano de Saúde, Academia..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Valor Mensal (R$)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 350,00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Dia de Vencimento
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={newDueDay}
                      onChange={(e) => setNewDueDay(e.target.value)}
                      className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Conta de Débito</label>
                    <select
                      value={newBankSlug}
                      onChange={(e) => setNewBankSlug(e.target.value as BankSlug)}
                      className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="itau">Itaú</option>
                      <option value="bradesco">Bradesco</option>
                      <option value="santander-pf">Santander PF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Código de Barras / Linha Digitável (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Código de barras para pagamento fácil"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#060c18] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-white">Débito Automático</p>
                    <p className="text-[11px] text-slate-400">Debitado automaticamente todo mês</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newAutoDebit}
                    onChange={(e) => setNewAutoDebit(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-colors shadow-md"
                  >
                    Salvar Despesa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
