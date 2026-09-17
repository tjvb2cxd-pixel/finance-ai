import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Filter, CreditCard, Repeat, Sparkles, CheckCircle2, Clock, CalendarDays, ShieldCheck } from 'lucide-react';
import { Transaction, BankAccount, FixedExpenseItem } from '../types';
import { FinancialCalendar } from './FinancialCalendar';
import { NewBillModal } from './NewBillModal';
import { GoogleCalendarSyncModal } from './GoogleCalendarSyncModal';
import { Bill } from './AlertsView';
import { usePrivacy } from '../contexts/PrivacyContext';
import { initGoogleCalendarAuth, getStoredGoogleAccount, GoogleAccountProfile } from '../lib/googleCalendar';

interface CalendarViewProps {
  transactions: Transaction[];
  banks: BankAccount[];
  fixedExpenses?: FixedExpenseItem[];
  onBackToOverview: () => void;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => void;
  onToggleStatus?: (id: string, newStatus: 'paid' | 'pending') => void;
  onToggleFixedExpenseStatus?: (id: string, newStatus: 'paid' | 'pending') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  banks,
  fixedExpenses = [],
  onBackToOverview,
  onAddTransaction,
  onToggleStatus,
  onToggleFixedExpenseStatus,
}) => {
  const { formatValue } = usePrivacy();
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [isGoogleCalendarModalOpen, setIsGoogleCalendarModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleAccountProfile | null>(() => getStoredGoogleAccount());

  useEffect(() => {
    const unsub = initGoogleCalendarAuth(
      (authedUser) => setGoogleUser(authedUser),
      () => setGoogleUser(getStoredGoogleAccount())
    );
    return () => unsub();
  }, []);

  // Compute top KPI metrics for calendar view
  const calendarMetrics = useMemo(() => {
    const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFixedPaid = fixedExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
    const totalFixedPending = fixedExpenses.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.amount, 0);

    const invoices = transactions.filter(t => t.isInvoice);
    const totalInvoices = invoices.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCommitments: totalFixed + totalInvoices,
      totalPaid: totalFixedPaid,
      totalPending: totalFixedPending + totalInvoices,
      eventsCount: fixedExpenses.length + invoices.length,
    };
  }, [fixedExpenses, transactions]);

  const handleAddNewBill = (bill: Omit<Bill, 'id' | 'status'>) => {
    if (!onAddTransaction) return;

    const bank = banks.find(b => b.slug === bill.bankSlug) || banks[0];

    onAddTransaction({
      title: bill.title,
      amount: bill.amount,
      date: new Date(bill.dueDate).toLocaleDateString('pt-BR'),
      rawDate: bill.dueDate,
      dueDate: bill.dueDate,
      type: 'expense',
      category: bill.type === 'cartao' ? 'Cartão de Crédito' : 'Moradia',
      categoryKey: bill.type === 'cartao' ? 'outros' : 'moradia',
      bankId: bank.id,
      bankName: bank.name,
      bankSlug: bank.slug,
      isInvoice: bill.type === 'cartao',
      isRecurring: bill.type === 'boleto',
      status: 'pending',
      barcode: bill.barcode,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-between min-h-[calc(100vh-230px)] w-full"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Voltar para Visão Geral"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Calendário Financeiro
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                Vencimentos & Faturas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize faturas de cartões de crédito e pagamentos recorrentes por data de vencimento
            </p>
          </div>
        </div>

        {/* Quick Action: Add new bill */}
        <button
          onClick={() => setIsNewBillModalOpen(true)}
          className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Vencimento</span>
        </button>
      </div>

      {/* Calendar Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Comprometido no Mês</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {formatValue(calendarMetrics.totalCommitments)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {calendarMetrics.eventsCount} compromissos no calendário
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Já Liquidado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatValue(calendarMetrics.totalPaid)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pagamentos já baixados
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0b1325]/90 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendente de Liquidação</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
              {formatValue(calendarMetrics.totalPending)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Faturas e contas a vencer
            </p>
          </div>
        </div>

        <div 
          onClick={() => setIsGoogleCalendarModalOpen(true)}
          className={`p-4 rounded-2xl bg-[#0b1325]/90 shadow-md flex flex-col justify-between cursor-pointer group transition-all border ${
            googleUser
              ? 'border-emerald-500/40 hover:border-emerald-400 hover:bg-[#081b24]'
              : 'border-slate-800/80 hover:border-cyan-500/50 hover:bg-[#0d172e]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors ${
              googleUser ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-slate-400 group-hover:text-cyan-300'
            }`}>
              {googleUser ? 'Google Conectado' : 'Google Calendar'}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
              googleUser
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20'
            }`}>
              {googleUser ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="mt-1">
            <h3 className={`text-sm sm:text-base font-bold font-mono flex items-center gap-1.5 truncate ${
              googleUser ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-cyan-400 group-hover:text-cyan-300'
            }`}>
              {googleUser?.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt="Google"
                  className="w-4 h-4 rounded-full border border-emerald-400 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CalendarDays className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">
                {googleUser ? (googleUser.displayName || googleUser.email.split('@')[0]) : 'Sincronização 24/7'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {googleUser ? `${googleUser.email} (Persistente)` : 'Clique para conectar sua conta Google'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Calendar Component */}
      <div className="flex-1 flex flex-col min-h-[560px]">
        <FinancialCalendar
          transactions={transactions}
          fixedExpenses={fixedExpenses}
          onToggleStatus={onToggleStatus}
          onToggleFixedExpenseStatus={onToggleFixedExpenseStatus}
          onOpenGoogleCalendarSync={() => setIsGoogleCalendarModalOpen(true)}
        />
      </div>

      {/* Bottom Status & Regulatory Ribbon */}
      <div className="bg-[#0b1325]/80 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 mt-auto shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-bold block">Previsão e Fluxo de Caixa Diário</span>
            <span className="text-[11px] text-slate-400">
              Vencimentos distribuídos ao longo do mês com cálculo automático de impacto no saldo consolidado
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">
            Modo: <strong className="text-cyan-400">Grade Interativa & Agenda</strong>
          </span>
          <span className="text-slate-400">
            Status: <strong className="text-emerald-400">Em dia</strong>
          </span>
        </div>
      </div>

      {/* New Bill Modal */}
      <NewBillModal
        isOpen={isNewBillModalOpen}
        onClose={() => setIsNewBillModalOpen(false)}
        onAddBill={handleAddNewBill}
      />

      {/* Google Calendar Sync Modal */}
      <GoogleCalendarSyncModal
        isOpen={isGoogleCalendarModalOpen}
        onClose={() => setIsGoogleCalendarModalOpen(false)}
        transactions={transactions}
        fixedExpenses={fixedExpenses}
      />
    </motion.div>
  );
};
