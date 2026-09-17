import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Repeat, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Filter, 
  CalendarDays, 
  ListFilter, 
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Transaction, FixedExpenseItem } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { BankLogo } from './BankLogos';
import { 
  getSyncedBillsMap, 
  syncBillToGoogleCalendar, 
  signInWithGoogleCalendar, 
  getGoogleCalendarToken,
  initGoogleCalendarAuth,
  getStoredGoogleAccount,
  fetchCloudSyncedBillsMap,
  GoogleAccountProfile
} from '../lib/googleCalendar';

export interface FinancialCalendarProps {
  transactions: Transaction[];
  fixedExpenses?: FixedExpenseItem[];
  onToggleStatus?: (id: string, newStatus: 'paid' | 'pending') => void;
  onToggleFixedExpenseStatus?: (id: string, newStatus: 'paid' | 'pending') => void;
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenGoogleCalendarSync?: () => void;
  isWidgetMode?: boolean;
}

interface CalendarDayEvent {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  day: number;
  month: number;
  year: number;
  isInvoice: boolean;
  isRecurring: boolean;
  isFixedExpense?: boolean;
  recurrencePeriod?: string;
  status: 'pending' | 'paid' | 'overdue';
  bankSlug: string;
  bankName: string;
  category: string;
  barcode?: string;
  cardLastDigits?: string;
  rawTx: Transaction;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({
  transactions,
  fixedExpenses = [],
  onToggleStatus,
  onToggleFixedExpenseStatus,
  onSelectTransaction,
  onOpenGoogleCalendarSync,
  isWidgetMode = false,
}) => {
  const { formatValue } = usePrivacy();

  // Active view date (Defaults to current date)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate()); // Default to today
  const [filterType, setFilterType] = useState<'all' | 'invoices' | 'recurring' | 'fixed' | 'pending' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local status overrides for smooth optimistic interactions
  const [localStatuses, setLocalStatuses] = useState<Record<string, 'paid' | 'pending'>>({});

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Extract all calendar events (invoices, recurring payments & fixed expenses)
  const allEvents = useMemo(() => {
    const events: CalendarDayEvent[] = [];

    // 1. Process regular transactions (invoices and recurring payments)
    transactions.forEach((tx) => {
      // Check if transaction is an invoice or recurring payment
      const isInvoice = !!(
        tx.isInvoice || 
        tx.category?.toLowerCase().includes('cartão') || 
        tx.title?.toLowerCase().includes('fatura')
      );
      const isRecurring = !!(
        tx.isRecurring || 
        tx.recurrencePeriod ||
        ['netflix', 'spotify', 'condomínio', 'enel', 'energia', 'internet', 'smart fit', 'academia', 'plano de saúde', 'salário'].some(
          keyword => tx.title.toLowerCase().includes(keyword)
        )
      );

      // We highlight invoices AND recurring payments
      if (!isInvoice && !isRecurring) return;

      const dateStr = tx.dueDate || tx.rawDate || tx.date;
      if (!dateStr) return;

      // Parse YYYY-MM-DD or DD/MM/YYYY
      let year = currentYear;
      let month = currentMonth;
      let day = 1;

      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }

      // Calculate status based on reference date (today)
      let calculatedStatus: 'pending' | 'paid' | 'overdue' = tx.status || 'pending';
      if (localStatuses[tx.id]) {
        calculatedStatus = localStatuses[tx.id];
      } else if (calculatedStatus !== 'paid') {
        const itemDate = new Date(year, month, day);
        const refToday = new Date();
        refToday.setHours(0, 0, 0, 0);
        if (itemDate < refToday) {
          calculatedStatus = 'overdue';
        }
      }

      events.push({
        id: tx.id,
        title: tx.title,
        amount: tx.amount,
        dueDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        month,
        year,
        isInvoice,
        isRecurring,
        isFixedExpense: tx.isFixedExpense || !!tx.fixedExpenseId,
        recurrencePeriod: tx.recurrencePeriod || (isRecurring ? 'Mensal' : undefined),
        status: calculatedStatus,
        bankSlug: tx.bankSlug,
        bankName: tx.bankName,
        category: tx.category,
        barcode: tx.barcode,
        cardLastDigits: tx.cardLastDigits,
        rawTx: tx,
      });
    });

    // 2. Process Fixed Expenses (Despesas Fixas)
    if (fixedExpenses && fixedExpenses.length > 0) {
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      fixedExpenses.forEach((fe) => {
        // Prevent duplicates if already represented by a transaction
        const alreadyRepresented = events.some(
          (e) => e.id === fe.id || e.id === `tx-fix-${fe.id}` || e.rawTx?.fixedExpenseId === fe.id
        );
        if (alreadyRepresented) return;

        // Clamp due day to maximum days of current month
        const day = Math.min(Math.max(1, fe.dueDay || 1), daysInCurrentMonth);
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Calculate status based on reference date (today)
        let calculatedStatus: 'pending' | 'paid' | 'overdue' = fe.status || 'pending';
        if (localStatuses[fe.id]) {
          calculatedStatus = localStatuses[fe.id];
        } else if (calculatedStatus !== 'paid') {
          const itemDate = new Date(currentYear, currentMonth, day);
          const refToday = new Date();
          refToday.setHours(0, 0, 0, 0);
          if (itemDate < refToday) {
            calculatedStatus = 'overdue';
          }
        }

        const syntheticTx: Transaction = {
          id: fe.id,
          title: fe.title,
          amount: fe.amount,
          date: `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`,
          rawDate: dateStr,
          dueDate: dateStr,
          type: 'expense',
          category: fe.category || 'Despesa Fixa',
          categoryKey: 'moradia',
          bankId: 'bank-fixed',
          bankName: fe.bankName || 'Conta Padrão',
          bankSlug: fe.bankSlug || 'nubank',
          isRecurring: true,
          status: calculatedStatus,
          barcode: fe.barcode,
        };

        events.push({
          id: fe.id,
          title: fe.title,
          amount: fe.amount,
          dueDate: dateStr,
          day,
          month: currentMonth,
          year: currentYear,
          isInvoice: false,
          isRecurring: true,
          isFixedExpense: true,
          recurrencePeriod: fe.frequency === 'yearly' ? 'Anual' : fe.frequency === 'weekly' ? 'Semanal' : 'Mensal',
          status: calculatedStatus,
          bankSlug: fe.bankSlug || 'nubank',
          bankName: fe.bankName || 'Conta Padrão',
          category: fe.category || 'Despesa Fixa',
          barcode: fe.barcode,
          rawTx: syntheticTx,
        });
      });
    }

    return events;
  }, [transactions, fixedExpenses, currentMonth, currentYear, localStatuses]);

  // Filter events for the currently active month & year
  const monthEvents = useMemo(() => {
    return allEvents.filter(e => e.month === currentMonth && e.year === currentYear);
  }, [allEvents, currentMonth, currentYear]);

  // Apply user filter tab
  const filteredEvents = useMemo(() => {
    return monthEvents.filter((e) => {
      if (filterType === 'invoices') return e.isInvoice;
      if (filterType === 'recurring') return e.isRecurring;
      if (filterType === 'fixed') return e.isFixedExpense;
      if (filterType === 'pending') return e.status === 'pending' || e.status === 'overdue';
      if (filterType === 'paid') return e.status === 'paid';
      return true;
    });
  }, [monthEvents, filterType]);

  // Map events by day of current month: { [day: number]: CalendarDayEvent[] }
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarDayEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!map[e.day]) map[e.day] = [];
      map[e.day].push(e);
    });
    return map;
  }, [filteredEvents]);

  // Monthly KPI metrics
  const monthlyMetrics = useMemo(() => {
    const invoiceTotal = monthEvents
      .filter(e => e.isInvoice)
      .reduce((sum, e) => sum + e.amount, 0);

    const recurringTotal = monthEvents
      .filter(e => e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);

    const fixedTotal = monthEvents
      .filter(e => e.isFixedExpense)
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingTotal = monthEvents
      .filter(e => e.status === 'pending' || e.status === 'overdue')
      .reduce((sum, e) => sum + e.amount, 0);

    const paidTotal = monthEvents
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalBills = monthEvents.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalBills,
      invoiceTotal,
      recurringTotal,
      fixedTotal,
      pendingTotal,
      paidTotal,
      invoiceCount: monthEvents.filter(e => e.isInvoice).length,
      recurringCount: monthEvents.filter(e => e.isRecurring).length,
      fixedCount: monthEvents.filter(e => e.isFixedExpense).length,
      pendingCount: monthEvents.filter(e => e.status === 'pending' || e.status === 'overdue').length,
    };
  }, [monthEvents]);

  // Calendar Grid Calculation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      dateKey: string;
      isToday: boolean;
    }[] = [];

    const todayObj = new Date();
    const isCurrentYearAndMonth = currentYear === todayObj.getFullYear() && currentMonth === todayObj.getMonth();
    const todayDate = todayObj.getDate();

    // Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push({
        day,
        isCurrentMonth: false,
        dateKey: `prev-${day}`,
        isToday: false,
      });
    }

    // Current month cells
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const isToday = isCurrentYearAndMonth && d === todayDate;
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateKey: `curr-${d}`,
        isToday,
      });
    }

    // Next month trailing padding cells to complete a 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      cells.push({
        day: n,
        isCurrentMonth: false,
        dateKey: `next-${n}`,
        isToday: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  };

  // Toggle paid status
  const handleTogglePaid = (event: CalendarDayEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = event.status === 'paid' ? 'pending' : 'paid';
    setLocalStatuses(prev => ({
      ...prev,
      [event.id]: newStatus,
    }));
    if (event.isFixedExpense && onToggleFixedExpenseStatus) {
      onToggleFixedExpenseStatus(event.id, newStatus);
    } else if (onToggleStatus) {
      onToggleStatus(event.id, newStatus);
    }
  };

  // Copy barcode
  const handleCopyBarcode = (barcode: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Google Calendar integration state
  const [syncedMap, setSyncedMap] = useState<Record<string, string>>(() => getSyncedBillsMap());
  const [syncingBillId, setSyncingBillId] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleAccountProfile | null>(() => getStoredGoogleAccount());

  useEffect(() => {
    fetchCloudSyncedBillsMap().then((map) => setSyncedMap(map));
    const unsub = initGoogleCalendarAuth(
      (authedUser) => setGoogleUser(authedUser),
      () => setGoogleUser(getStoredGoogleAccount())
    );
    return () => unsub();
  }, []);

  const handleQuickSyncToGoogleCalendar = async (item: CalendarDayEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    let token = getGoogleCalendarToken();
    if (!token) {
      const res = await signInWithGoogleCalendar();
      if (!res) {
        if (onOpenGoogleCalendarSync) onOpenGoogleCalendarSync();
        return;
      }
      token = res.accessToken;
      setGoogleUser(res.user);
    }

    setSyncingBillId(item.id);
    try {
      const formattedAmount = item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const res = await syncBillToGoogleCalendar(
        {
          id: item.id,
          summary: `💸 Vencimento: ${item.title} (${formattedAmount})`,
          description: `Compromisso financeiro agendado:\n• Valor: ${formattedAmount}\n• Instituição: ${item.bankName}\n• Categoria: ${item.category}\n• Vencimento: ${item.day}/${item.month + 1}/${item.year}`,
          startDate: item.dueDate,
          amount: item.amount,
          bankName: item.bankName,
        },
        token
      );
      if (res.success && res.eventLink) {
        setSyncedMap((prev) => ({ ...prev, [item.id]: res.eventLink! }));
      } else if (!res.success && res.error) {
        if (res.error.includes('authentication') || res.error.includes('OAuth') || res.error.includes('401') || res.error.includes('credenciais')) {
          if (onOpenGoogleCalendarSync) {
            onOpenGoogleCalendarSync();
          }
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar com Google Calendar:', err);
      if (onOpenGoogleCalendarSync) {
        onOpenGoogleCalendarSync();
      }
    } finally {
      setSyncingBillId(null);
    }
  };

  // Selected Day's events
  const selectedEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return eventsByDay[selectedDay] || [];
  }, [selectedDay, eventsByDay]);

  return (
    <div
      className={`relative bg-[#070e1e]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-4 z-50 overflow-y-auto bg-[#060b14]/95 border-cyan-500/40 p-6'
          : 'h-full'
      }`}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 15px rgba(var(--theme-glow-rgb), 0.1)',
      }}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Vencimentos & Pagamentos Recorrentes
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Calendário
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acompanhe as datas de vencimento de faturas de cartão e assinaturas
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Month Navigation */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-200 px-3 min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              title="Próximo mês"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Jump to Today */}
          <button
            onClick={handleJumpToToday}
            className="text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 hover:text-cyan-300 border border-slate-700/60 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hoje</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Visualização em Grade"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              title="Visualização em Lista / Agenda"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>

          {/* Google Calendar Sync Button */}
          {onOpenGoogleCalendarSync && (
            <button
              onClick={onOpenGoogleCalendarSync}
              title={
                googleUser
                  ? `Google Calendar Conectado: ${googleUser.email}`
                  : 'Sincronizar com Google Agenda'
              }
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border ${
                googleUser
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {googleUser?.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google'}
                  className="w-4 h-4 rounded-full object-cover border border-emerald-400 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CalendarIcon className={`w-3.5 h-3.5 ${googleUser ? 'text-emerald-400' : 'text-cyan-400'}`} />
              )}
              <span className="hidden sm:inline">
                {googleUser
                  ? (googleUser.displayName?.split(' ')[0] || googleUser.email.split('@')[0])
                  : 'Google Agenda'}
              </span>
              {googleUser && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              )}
            </button>
          )}

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher' : 'Expandir calendário'}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {/* Faturas de Cartão */}
        <div className="bg-[#0b1325]/70 border border-purple-500/30 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold block truncate">
              Faturas ({monthlyMetrics.invoiceCount})
            </span>
            <span className="text-sm font-black text-purple-200 font-mono tracking-tight block truncate">
              {formatValue(monthlyMetrics.invoiceTotal)}
            </span>
          </div>
        </div>

        {/* Pagamentos Recorrentes */}
        <div className="bg-[#0b1325]/70 border border-cyan-500/30 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Repeat className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold block truncate">
              Recorrentes ({monthlyMetrics.recurringCount})
            </span>
            <span className="text-sm font-black text-cyan-200 font-mono tracking-tight block truncate">
              {formatValue(monthlyMetrics.recurringTotal)}
            </span>
          </div>
        </div>

        {/* Pendentes / A Vencer */}
        <div className="bg-[#0b1325]/70 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold block truncate">
              A Vencer ({monthlyMetrics.pendingCount})
            </span>
            <span className="text-sm font-black text-amber-200 font-mono tracking-tight block truncate">
              {formatValue(monthlyMetrics.pendingTotal)}
            </span>
          </div>
        </div>

        {/* Já Pagos */}
        <div className="bg-[#0b1325]/70 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold block truncate">
              Já Pago
            </span>
            <span className="text-sm font-black text-emerald-200 font-mono tracking-tight block truncate">
              {formatValue(monthlyMetrics.paidTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-slate-500" /> Filtros:
        </span>
        {[
          { id: 'all', label: `Todos (${monthEvents.length})` },
          ...(monthlyMetrics.fixedCount > 0 ? [{ id: 'fixed', label: `Despesas Fixas (${monthlyMetrics.fixedCount})` }] : []),
          { id: 'invoices', label: `Faturas de Cartão (${monthlyMetrics.invoiceCount})` },
          { id: 'recurring', label: `Recorrentes (${monthlyMetrics.recurringCount})` },
          { id: 'pending', label: `Pendentes (${monthlyMetrics.pendingCount})` },
          { id: 'paid', label: `Pagos` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content: Grid View or Agenda View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Calendar Table Grid (7 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
              {WEEKDAYS.map((wd, i) => (
                <div
                  key={wd}
                  className={`text-[11px] font-bold uppercase tracking-wider py-1 rounded-md ${
                    i === 0 || i === 6 ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
              {calendarGrid.map((cell) => {
                const dayEvents = cell.isCurrentMonth ? eventsByDay[cell.day] || [] : [];
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDay === cell.day && cell.isCurrentMonth;
                const hasInvoices = dayEvents.some(e => e.isInvoice);
                const hasRecurring = dayEvents.some(e => e.isRecurring);
                const hasFixed = dayEvents.some(e => e.isFixedExpense);
                const hasPending = dayEvents.some(e => e.status === 'pending' || e.status === 'overdue');
                const hasOverdue = dayEvents.some(e => e.status === 'overdue');
                const allPaid = hasEvents && dayEvents.every(e => e.status === 'paid');

                return (
                  <button
                    key={cell.dateKey}
                    disabled={!cell.isCurrentMonth}
                    onClick={() => cell.isCurrentMonth && setSelectedDay(cell.day)}
                    className={`relative min-h-[58px] sm:min-h-[72px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-950/20 border-slate-900/40 text-slate-700 cursor-default opacity-40'
                        : isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : cell.isToday
                        ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                        : hasEvents
                        ? 'bg-[#091224]/90 hover:bg-[#0d1b33] border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold leading-none ${
                          cell.isToday
                            ? 'text-cyan-300 bg-cyan-950 border border-cyan-500/40 px-1.5 py-0.5 rounded-md'
                            : isSelected
                            ? 'text-cyan-300'
                            : cell.isCurrentMonth
                            ? 'text-slate-300 group-hover:text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {/* Overdue Alert Dot */}
                      {hasOverdue && (
                        <span 
                          className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" 
                          title="Vencimento atrasado!" 
                        />
                      )}
                    </div>

                    {/* Event indicators & tags on the cell */}
                    {hasEvents && (
                      <div className="mt-1 space-y-1 w-full overflow-hidden">
                        {/* Summary Pill: Invoice, Fixed Expense or Recurring */}
                        {hasInvoices && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold px-1 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 truncate shadow-sm">
                            <CreditCard className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                            <span className="truncate">Fatura</span>
                          </div>
                        )}

                        {hasFixed && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 truncate shadow-sm">
                            <Repeat className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                            <span className="truncate">{dayEvents.find(e => e.isFixedExpense)?.title.split(' ')[0]}</span>
                          </div>
                        )}

                        {hasRecurring && !hasFixed && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 truncate shadow-sm">
                            <Repeat className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{dayEvents.find(e => e.isRecurring && !e.isFixedExpense)?.title.split(' ')[0]}</span>
                          </div>
                        )}

                        {/* Amount or status indicator */}
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className={`font-bold truncate ${
                            allPaid 
                              ? 'text-emerald-400 line-through opacity-80' 
                              : hasOverdue
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}>
                            {formatValue(dayEvents.reduce((s, e) => s + e.amount, 0))}
                          </span>
                          <span 
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              allPaid 
                                ? 'bg-emerald-400' 
                                : hasOverdue 
                                ? 'bg-red-400' 
                                : 'bg-amber-400'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Side Panel */}
          <div className="lg:col-span-4 bg-[#081022]/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              {/* Selected Date Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {selectedDay !== null 
                        ? `${selectedDay} de ${MONTH_NAMES[currentMonth]} de ${currentYear}`
                        : 'Selecione um dia'}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {selectedEvents.length} compromisso{selectedEvents.length !== 1 ? 's' : ''} registrado{selectedEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {(() => {
                  const now = new Date();
                  const isTodaySelected = selectedDay === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                  return isTodaySelected ? (
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                      Hoje
                    </span>
                  ) : null;
                })()}
              </div>

              {/* List of items on this selected date */}
              {selectedEvents.length > 0 ? (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {selectedEvents.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border transition-all ${
                        item.status === 'paid'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                          : item.status === 'overdue'
                          ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                          : 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BankLogo slug={item.bankSlug} size={28} className="w-7 h-7 flex-shrink-0" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">
                              {item.title}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span>{item.bankName}</span>
                              <span>•</span>
                              <span className="text-slate-300">{item.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <span className={`text-xs font-mono font-black tracking-tight ${
                          item.status === 'paid' ? 'text-emerald-400 line-through' : 'text-cyan-300'
                        }`}>
                          {formatValue(item.amount)}
                        </span>
                      </div>

                      {/* Item Tags & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          {item.isInvoice && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5" /> Fatura {item.cardLastDigits ? `•••• ${item.cardLastDigits}` : ''}
                            </span>
                          )}
                          {item.isFixedExpense ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" /> Despesa Fixa
                            </span>
                          ) : item.isRecurring ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" /> Recorrente
                            </span>
                          ) : null}
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            item.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : item.status === 'overdue'
                              ? 'bg-red-950 text-red-300 border-red-500/40'
                              : 'bg-amber-950 text-amber-300 border-amber-500/40'
                          }`}>
                            {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </span>
                        </div>

                        {/* Action: Toggle Paid / Copy Barcode / Google Calendar */}
                        <div className="flex items-center gap-1.5">
                          {syncedMap[item.id] ? (
                            <a
                              href={syncedMap[item.id]}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Abrir no Google Calendar"
                              className="p-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 text-[10px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="hidden sm:inline">Na Agenda</span>
                            </a>
                          ) : (
                            <button
                              onClick={(e) => handleQuickSyncToGoogleCalendar(item, e)}
                              disabled={syncingBillId === item.id}
                              title="Sincronizar no Google Calendar"
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1 text-[10px]"
                            >
                              <CalendarDays className={`w-3 h-3 ${syncingBillId === item.id ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline">Google</span>
                            </button>
                          )}

                          {item.barcode && (
                            <button
                              onClick={(e) => handleCopyBarcode(item.barcode!, item.id, e)}
                              title="Copiar código de barras"
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={(e) => handleTogglePaid(item, e)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                              item.status === 'paid'
                                ? 'bg-emerald-900/40 hover:bg-emerald-800/40 text-emerald-300 border-emerald-500/40'
                                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 shadow-sm'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{item.status === 'paid' ? 'Desmarcar' : 'Marcar Pago'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                  <p className="text-xs font-medium">Nenhum vencimento neste dia</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Clique em qualquer dia com marcador para inspecionar
                  </p>
                </div>
              )}
            </div>

            {/* Quick Summary Footer */}
            <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Total no dia:</span>
              <span className="font-mono font-bold text-white text-xs">
                {formatValue(selectedEvents.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredEvents.length > 0 ? (
            filteredEvents
              .sort((a, b) => a.day - b.day)
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                    item.status === 'paid'
                      ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-300'
                      : item.status === 'overdue'
                      ? 'bg-red-950/25 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Date Badge + Bank Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Day Badge */}
                    <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                        {WEEKDAYS[new Date(item.year, item.month, item.day).getDay()]}
                      </span>
                      <span className="text-sm font-black text-cyan-300 font-mono leading-none mt-0.5">
                        {item.day}
                      </span>
                    </div>

                    <BankLogo slug={item.bankSlug} size={32} className="w-8 h-8 flex-shrink-0" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.title}
                        </h4>
                        {item.isInvoice && (
                          <span className="text-[9px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded">
                            Fatura
                          </span>
                        )}
                        {item.isFixedExpense ? (
                          <span className="text-[9px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded">
                            Despesa Fixa
                          </span>
                        ) : item.isRecurring ? (
                          <span className="text-[9px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded">
                            Recorrente
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {item.bankName} • Vencimento: {item.day} de {MONTH_NAMES[item.month]}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status & Action */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-mono font-black tracking-tight block ${
                        item.status === 'paid' ? 'text-emerald-400 line-through' : 'text-white'
                      }`}>
                        {formatValue(item.amount)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                        item.status === 'paid'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : item.status === 'overdue'
                          ? 'bg-red-950 text-red-300 border-red-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}>
                        {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Vencido' : 'A Vencer'}
                      </span>
                    </div>

                    {/* Google Calendar Quick Sync */}
                    {syncedMap[item.id] ? (
                      <a
                        href={syncedMap[item.id]}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Ver na Agenda Google"
                        className="p-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Na Agenda</span>
                      </a>
                    ) : (
                      <button
                        onClick={(e) => handleQuickSyncToGoogleCalendar(item, e)}
                        disabled={syncingBillId === item.id}
                        title="Sincronizar no Google Calendar"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors flex items-center gap-1 text-xs"
                      >
                        <CalendarDays className={`w-3.5 h-3.5 ${syncingBillId === item.id ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Google Agenda</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => handleTogglePaid(item, e)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        item.status === 'paid'
                          ? 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.status === 'paid' ? 'Pago' : 'Pagar'}</span>
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <div className="py-16 text-center text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-cyan-400" />
              <p className="text-xs font-medium">Nenhum vencimento encontrado para o filtro selecionado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
