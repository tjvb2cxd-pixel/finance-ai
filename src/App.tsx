import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  INITIAL_BANKS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_EVOLUTION_POINTS,
  INITIAL_PROFILES,
  INITIAL_FIXED_EXPENSES,
  DEMO_BANKS,
  DEMO_TRANSACTIONS,
  DEMO_FIXED_EXPENSES,
} from './data/mockData';
import {
  BankAccount,
  CategoryExpense,
  ChatMessage,
  FinancialEvolutionPoint,
  FinancialSummary,
  Transaction,
  UserProfile,
  FixedExpenseItem,
  CategoryKey,
} from './types';
import {
  fetchCloudTransactions,
  saveCloudTransaction,
  saveCloudTransactionsBatch,
  deleteCloudTransaction,
  fetchCloudBanks,
  saveCloudBank,
  saveCloudBanksBatch,
  deleteCloudBank,
  fetchCloudProfiles,
  saveCloudProfile,
  deleteCloudProfile,
  subscribeCloudTransactions,
  subscribeCloudBanks,
  subscribeCloudFixedExpenses,
  fetchCloudFixedExpenses,
  saveCloudFixedExpense,
  saveCloudFixedExpensesBatch,
  deleteCloudFixedExpense,
  clearAllCloudData,
} from './lib/firebase';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { FinHeroAssistant } from './components/FinHeroAssistant';
import { SummaryCards } from './components/SummaryCards';
import { ConnectedBanks } from './components/ConnectedBanks';
import { CategoryDonutChart } from './components/CategoryDonutChart';
import { FinancialEvolutionChart } from './components/FinancialEvolutionChart';
import { RecentTransactions } from './components/RecentTransactions';
import { UploadStatementModal } from './components/UploadStatementModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { VoiceTransactionModal } from './components/VoiceTransactionModal';
import { ImportStatementModal } from './components/ImportStatementModal';
import { FinChatModal } from './components/FinChatModal';
import { usePrivacy } from './contexts/PrivacyContext';
import { FullTransactionsView } from './components/FullTransactionsView';
import { AccountsView } from './components/AccountsView';
import { FixedExpensesView } from './components/FixedExpensesView';
import { triggerSuccessFeedback, triggerSyncFeedback } from './utils/feedback';
import { ProfilesView } from './components/ProfilesView';
import { RenderProfileAvatar } from './components/ProfileAvatars';
import { EditProfileModal } from './components/EditProfileModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { ProfileDropdown } from './components/ProfileDropdown';
import { WidgetConfig } from './components/DashboardCustomizeModal';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import {
  ChevronDown,
  Menu,
  Plus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Target,
  Sparkles,
  TrendingUp,
  FileText,
  Upload,
} from 'lucide-react';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const tabTransitionVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const getCategoryKey = (catName: string): CategoryKey => {
  const map: Record<string, string> = {
    moradia: 'moradia',
    educação: 'educacao',
    educacao: 'educacao',
    saúde: 'saude',
    saude: 'saude',
    transporte: 'transporte',
    'assinaturas & lazer': 'lazer',
    lazer: 'lazer',
    serviços: 'servicos',
    servicos: 'servicos',
    alimentação: 'alimentacao',
    alimentacao: 'alimentacao',
    outros: 'outros',
  };
  return map[catName?.toLowerCase()?.trim() || ''] || 'moradia';
};

// Enforce clean zero-state for all financial metrics (despesas, receitas, saldos, despesas fixas)
const APP_DATA_VERSION = 'zeroed_expenses_v9';
if (typeof window !== 'undefined') {
  try {
    const currentVer = localStorage.getItem('fin_app_version');
    if (!currentVer) {
      localStorage.setItem('fin_app_version', APP_DATA_VERSION);
    }
  } catch (e) {
    console.warn('LocalStorage version check:', e);
  }
}

export default function App() {
  const { formatValue } = usePrivacy();

  // State - All initialized to strict zero values
  const [banks, setBanks] = useState<BankAccount[]>(() => {
    try {
      const stored = localStorage.getItem('fin_cloud_banks');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_BANKS;
  });
  const [selectedBankSlug, setSelectedBankSlug] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryExpense[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('fin_cloud_transactions');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_TRANSACTIONS;
  });
  const [evolutionPoints, setEvolutionPoints] = useState<FinancialEvolutionPoint[]>(INITIAL_EVOLUTION_POINTS);

  // Fixed Expenses State
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>(() => {
    try {
      const stored = localStorage.getItem('finance_fixed_expenses_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Profiles State - Synchronously initialized from local cache to prevent race condition PIN glitches
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fin_cloud_profiles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any) => ({
              ...p,
              pin: p.pin === '1234' ? '9921' : (p.pin || '9921'),
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached profiles:', e);
      }
    }
    return INITIAL_PROFILES;
  });
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fin_cloud_profiles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0].id;
          }
        }
      } catch {
        // ignore
      }
    }
    return INITIAL_PROFILES[0].id;
  });
  const [isProfilesScreenOpen, setIsProfilesScreenOpen] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleProfileSwitch = (selected: UserProfile) => {
    setActiveProfileId(selected.id);
    setIsProfilesScreenOpen(false);
    setProfileDropdownOpen(false);
    
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-profile-${Date.now()}`,
        sender: 'fin',
        text: `Perfil ativo: ${selected.name}! Seus dados bancários estão prontos. Como posso te orientar hoje?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavItemKey>('visao-geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isUploadStatementModalOpen, setIsUploadStatementModalOpen] = useState(false);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isImportStatementModalOpen, setIsImportStatementModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState<WidgetConfig[]>([
    { id: 'assistant', visible: true },
    { id: 'summary', visible: true },
    { id: 'banks', visible: true },
    { id: 'donut', visible: true },
    { id: 'evolution', visible: true },
    { id: 'transactions', visible: true },
  ]);

  // Live Sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Agora');
  const [latestFinAnswer, setLatestFinAnswer] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Recalculate categories from transactions helper
  const syncCategoriesFromTxs = (txs: Transaction[]) => {
    const expenseTxs = txs.filter((t) => t.type === 'expense');
    const catTotals: Record<string, number> = {};
    INITIAL_CATEGORIES.forEach((c) => {
      catTotals[c.key] = 0;
    });
    expenseTxs.forEach((t) => {
      const key = t.categoryKey || 'outros';
      catTotals[key] = (catTotals[key] || 0) + t.amount;
    });
    const totalExpense = Object.values(catTotals).reduce((a, b) => a + b, 0);
    setCategories(
      INITIAL_CATEGORIES.map((c) => {
        const amount = catTotals[c.key] || 0;
        return {
          ...c,
          amount,
          percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
    );
  };

  // Load from Cloud Persistence (Firestore) on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCloudData() {
      try {
        const [cloudTxs, cloudBanksList, cloudProfList, cloudFixedList] = await Promise.all([
          fetchCloudTransactions(),
          fetchCloudBanks(),
          fetchCloudProfiles(),
          fetchCloudFixedExpenses(),
        ]);

        if (!isMounted) return;

        // 1. Transactions
        if (cloudTxs && cloudTxs.length > 0) {
          setTransactions(cloudTxs);
          syncCategoriesFromTxs(cloudTxs);
        } else {
          // If cloud has 0 transactions, check if local storage has transactions to preserve & sync
          const localTxs = typeof window !== 'undefined' ? localStorage.getItem('fin_cloud_transactions') : null;
          if (localTxs) {
            try {
              const parsed: Transaction[] = JSON.parse(localTxs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTransactions(parsed);
                syncCategoriesFromTxs(parsed);
                saveCloudTransactionsBatch(parsed);
              } else {
                setTransactions([]);
                syncCategoriesFromTxs([]);
              }
            } catch {
              setTransactions([]);
              syncCategoriesFromTxs([]);
            }
          } else {
            setTransactions([]);
            syncCategoriesFromTxs([]);
          }
        }

        // 2. Fixed Expenses
        if (cloudFixedList && cloudFixedList.length > 0) {
          setFixedExpenses(cloudFixedList);
          try {
            localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(cloudFixedList));
          } catch {
            // ignore
          }
        } else {
          // If cloud has 0 records, check local storage to preserve user's entries
          const localStored = typeof window !== 'undefined' ? localStorage.getItem('finance_fixed_expenses_v2') : null;
          if (localStored) {
            try {
              const parsed: FixedExpenseItem[] = JSON.parse(localStored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFixedExpenses(parsed);
                saveCloudFixedExpensesBatch(parsed);
              } else {
                setFixedExpenses([]);
              }
            } catch {
              setFixedExpenses([]);
            }
          } else {
            setFixedExpenses([]);
          }
        }

        // 3. Banks (Filter only Inter, Itaú, Bradesco, and Santander PF)
        const allowedSlugs = ['inter', 'itau', 'bradesco', 'santander-pf'];
        const filteredCloudBanks = (cloudBanksList || []).filter(
          (b) => allowedSlugs.includes(b.slug) && b.id !== 'bank-santander-pj' && b.slug !== 'santander-pj'
        );
        if (filteredCloudBanks.length > 0) {
          setBanks(filteredCloudBanks);
          try {
            localStorage.setItem('fin_cloud_banks', JSON.stringify(filteredCloudBanks));
          } catch {
            // ignore
          }
        } else {
          setBanks(INITIAL_BANKS);
          saveCloudBanksBatch(INITIAL_BANKS);
        }

        // 4. Profiles (Ensure PIN is consistently 9921 and never reverts to outdated 1234)
        if (cloudProfList && cloudProfList.length > 0) {
          const listWithPin = cloudProfList.map((p) => ({
            ...p,
            pin: p.pin === '1234' ? '9921' : (p.pin || '9921'),
          }));
          const tiagoList = listWithPin.filter((p) => p.name === 'Tiago' || p.id === 'profile-tiago');
          const finalProfiles = tiagoList.length > 0 ? tiagoList : listWithPin;
          setProfiles(finalProfiles);
          setActiveProfileId(finalProfiles[0].id);

          // If the profile had the legacy '1234' PIN, sync the corrected '9921' to cloud & storage
          if (finalProfiles[0]?.pin === '9921' && cloudProfList[0]?.pin === '1234') {
            saveCloudProfile(finalProfiles[0]);
          }
        } else {
          setProfiles(INITIAL_PROFILES);
          setActiveProfileId(INITIAL_PROFILES[0].id);
          saveCloudProfile(INITIAL_PROFILES[0]);
        }

        setCloudStatus('synced');
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
        setCloudStatus('offline');
      }
    }

    loadCloudData();

    // Subscribe to realtime cloud updates for transactions
    const unsubscribeTxs = subscribeCloudTransactions((updatedTxs) => {
      if (!isMounted) return;
      if (updatedTxs && updatedTxs.length > 0) {
        setTransactions(updatedTxs);
        syncCategoriesFromTxs(updatedTxs);
        try {
          localStorage.setItem('fin_cloud_transactions', JSON.stringify(updatedTxs));
        } catch {
          // ignore
        }
      }
    });

    // Subscribe to realtime cloud updates for banks
    const unsubscribeBanks = subscribeCloudBanks((updatedBanks) => {
      if (!isMounted) return;
      if (updatedBanks && updatedBanks.length > 0) {
        const allowedSlugs = ['inter', 'itau', 'bradesco', 'santander-pf'];
        const filtered = updatedBanks.filter(
          (b) => allowedSlugs.includes(b.slug) && b.id !== 'bank-santander-pj' && b.slug !== 'santander-pj'
        );
        if (filtered.length > 0) {
          setBanks(filtered);
          try {
            localStorage.setItem('fin_cloud_banks', JSON.stringify(filtered));
          } catch {
            // ignore
          }
        }
      }
    });

    // Subscribe to realtime cloud updates for fixed expenses
    const unsubscribeFixed = subscribeCloudFixedExpenses((updatedFixed) => {
      if (!isMounted) return;
      if (updatedFixed && updatedFixed.length > 0) {
        setFixedExpenses(updatedFixed);
        try {
          localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updatedFixed));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeTxs();
      unsubscribeBanks();
      unsubscribeFixed();
    };
  }, []);

  // Chat History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'fin',
      text: 'Olá, Tiago! Eu sou o FIN, seu assistente financeiro inteligente. Seus painéis estão zerados e sincronizados com a nuvem, prontos para receber seus extratos ou novos lançamentos. Como posso te orientar hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Derived Financial Summary based on bank filter
  const displayedBanks = selectedBankSlug
    ? banks.filter((b) => b.slug === selectedBankSlug)
    : banks;

  const displayedTransactions = selectedBankSlug
    ? transactions.filter((t) => t.bankSlug === selectedBankSlug)
    : transactions;

  const totalBalance = displayedBanks.reduce((sum, b) => sum + b.availableBalance, 0);
  const totalReceitas = displayedTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = displayedTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingExpenses = displayedTransactions
    .filter((t) => t.type === 'expense' && t.status !== 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = displayedTransactions
    .filter((t) => t.type === 'income' && t.status !== 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoProjetado = totalBalance - pendingExpenses + pendingIncome;

  const summary: FinancialSummary = {
    saldoTotal: totalBalance,
    receitas: totalReceitas,
    despesas: totalDespesas,
    contasConectadas: banks.length,
    periodLabel: 'Este mês',
    saldoProjetado,
    despesasPendentes: pendingExpenses,
  };

  // Dynamically compute financial evolution points for the current period
  const computedEvolutionPoints = useMemo<FinancialEvolutionPoint[]>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthLabel = monthNames[currentMonth];

    const milestones = [7, 14, 21, 28];
    return milestones.map((day) => {
      const dayDate = new Date(currentYear, currentMonth, day);
      const dateKey = `${String(day).padStart(2, '0')} ${monthLabel}`;
      const fullDate = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;

      const txsUntil = displayedTransactions.filter((t) => {
        if (!t.rawDate) return false;
        const d = new Date(t.rawDate);
        return !isNaN(d.getTime()) && d <= dayDate;
      });

      const rec = txsUntil.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const desp = txsUntil.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = rec - desp;
      const saldo = Math.max(0, totalBalance + net);

      return {
        date: dateKey,
        fullDate,
        receitas: rec,
        despesas: desp,
        saldo,
        saldoAnterior: 0,
        receitasAnterior: 0,
        despesasAnterior: 0,
        previousDateLabel: `${String(day).padStart(2, '0')} ${monthNames[(currentMonth + 11) % 12]}`,
      };
    });
  }, [displayedTransactions, totalBalance]);

  // Adjust / Correct Bank Balance manually
  const handleSaveBankBalance = (bankId: string, newBalance: number) => {
    triggerSuccessFeedback();
    setBanks((prev) => {
      const updated = prev.map((b) =>
        b.id === bankId
          ? {
              ...b,
              balance: newBalance,
              availableBalance: newBalance,
              lastSync: 'Agora',
            }
          : b
      );
      saveCloudBanksBatch(updated);
      return updated;
    });
  };

  // Restore Demo Data with R$ 3.500 balance, 6 accounts, 9 transactions
  const handleRestoreDemoData = async () => {
    triggerSuccessFeedback();
    setCloudStatus('saving');
    try {
      setBanks(DEMO_BANKS);
      setTransactions(DEMO_TRANSACTIONS);
      setFixedExpenses(DEMO_FIXED_EXPENSES);
      syncCategoriesFromTxs(DEMO_TRANSACTIONS);

      await Promise.all([
        saveCloudBanksBatch(DEMO_BANKS),
        saveCloudTransactionsBatch(DEMO_TRANSACTIONS),
        saveCloudFixedExpensesBatch(DEMO_FIXED_EXPENSES),
      ]);
      try {
        localStorage.setItem('fin_cloud_banks', JSON.stringify(DEMO_BANKS));
        localStorage.setItem('fin_cloud_transactions', JSON.stringify(DEMO_TRANSACTIONS));
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(DEMO_FIXED_EXPENSES));
      } catch {
        // ignore
      }
      setCloudStatus('synced');
    } catch (err) {
      console.warn('Error restoring demo data:', err);
      setCloudStatus('synced');
    }
  };

  // Zero out all financial values completely
  const handleZeroAllValues = async () => {
    triggerSuccessFeedback();
    setCloudStatus('saving');
    try {
      const zeroedBanks = banks.map((b) => ({
        ...b,
        balance: 0.0,
        availableBalance: 0.0,
        lastSync: 'Aguardando lançamentos',
      }));
      setBanks(zeroedBanks);
      setTransactions([]);
      setFixedExpenses([]);
      syncCategoriesFromTxs([]);

      await clearAllCloudData();
      await saveCloudBanksBatch(zeroedBanks);

      try {
        localStorage.setItem('fin_cloud_banks', JSON.stringify(zeroedBanks));
        localStorage.setItem('fin_cloud_transactions', JSON.stringify([]));
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify([]));
      } catch {
        // ignore
      }
      setCloudStatus('synced');
    } catch (err) {
      console.warn('Error zeroing all data:', err);
      setCloudStatus('synced');
    }
  };

  // Trigger Automatic Bank & Cloud Sync
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setCloudStatus('saving');
    triggerSyncFeedback();

    try {
      // 1. Push current memory/local state to Firestore to ensure cloud is 100% updated
      if (transactions.length > 0) {
        await saveCloudTransactionsBatch(transactions);
      }
      if (banks.length > 0) {
        await saveCloudBanksBatch(banks);
      }
      if (fixedExpenses.length > 0) {
        await saveCloudFixedExpensesBatch(fixedExpenses);
      }

      // 2. Fetch fresh cloud records
      const [freshTxs, freshBanks, freshFixed] = await Promise.all([
        fetchCloudTransactions(),
        fetchCloudBanks(),
        fetchCloudFixedExpenses(),
      ]);

      if (freshTxs !== null && freshTxs !== undefined) {
        setTransactions(freshTxs);
        syncCategoriesFromTxs(freshTxs);
      }
      if (freshBanks && freshBanks.length > 0) {
        setBanks(freshBanks);
      }
      if (freshFixed !== null && freshFixed !== undefined) {
        setFixedExpenses(freshFixed);
      }

      const now = new Date();
      setLastSyncTime(`Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setCloudStatus('synced');
    } catch (err) {
      console.warn('Sync notice:', err);
      const now = new Date();
      setLastSyncTime(`Hoje, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setCloudStatus('synced');
    } finally {
      setIsSyncing(false);
    }
  };

  // Ask FIN Question (calls Express Gemini API with real-time context)
  const handleAskFIN = async (question: string): Promise<string> => {
    try {
      const res = await fetch('/api/fin/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userName: activeProfile.name,
          context: {
            totalBalance,
            receitas: totalReceitas,
            despesas: totalDespesas,
            saldoProjetado,
            banks: banks.map((b) => ({ name: b.name, balance: b.availableBalance })),
            categories: categories.filter((c) => c.amount > 0).map((c) => ({
              name: c.name,
              amount: c.amount,
              percentage: c.percentage,
            })),
          },
        }),
      });

      const data = await res.json();
      const answer = data.answer || `Análise concluída com base no seu saldo atual de R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      setLatestFinAnswer(answer);

      // Add to chat history
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setChatMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'user', text: question, timestamp: time },
        { id: `fin-${Date.now()}`, sender: 'fin', text: answer, timestamp: time },
      ]);

      return answer;
    } catch {
      const fallback = `Seu saldo consolidado atual é de R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${banks.length} contas conectadas. Receitas: R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Despesas: R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
      setLatestFinAnswer(fallback);
      return fallback;
    }
  };

  // Add new transaction and re-calculate
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    triggerSuccessFeedback();
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-user-${Date.now()}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    saveCloudTransaction(newTx);

    // Update bank balance
    setBanks((prev) => {
      const updated = prev.map((b) => {
        if (b.id === newTx.bankId) {
          const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
          return {
            ...b,
            balance: b.balance + delta,
            availableBalance: b.availableBalance + delta,
            lastSync: 'Agora',
          };
        }
        return b;
      });
      saveCloudBanksBatch(updated);
      return updated;
    });

    // Update categories if expense
    if (newTx.type === 'expense') {
      setCategories((prev) => {
        const updated = prev.map((c) =>
          c.key === newTx.categoryKey ? { ...c, amount: c.amount + newTx.amount } : c
        );
        const newTotal = updated.reduce((s, c) => s + c.amount, 0);
        return updated.map((c) => ({
          ...c,
          percentage: Math.round((c.amount / newTotal) * 100),
        }));
      });
    }
  };

  // Import batch transactions from OFX / CSV / PDF statement
  const handleImportMultipleTransactions = (newTxsData: Omit<Transaction, 'id'>[]) => {
    if (!newTxsData.length) return;
    triggerSuccessFeedback();
    const createdTxs: Transaction[] = newTxsData.map((txData, index) => ({
      ...txData,
      id: `tx-import-${Date.now()}-${index}`,
    }));

    setTransactions((prev) => [...createdTxs, ...prev]);
    saveCloudTransactionsBatch(createdTxs);

    // Update bank balances
    setBanks((prev) => {
      const updated = prev.map((b) => {
        const bankTxs = createdTxs.filter((tx) => tx.bankId === b.id);
        if (bankTxs.length === 0) return b;
        const delta = bankTxs.reduce(
          (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount),
          0
        );
        return {
          ...b,
          balance: b.balance + delta,
          availableBalance: b.availableBalance + delta,
          lastSync: 'Agora',
        };
      });
      saveCloudBanksBatch(updated);
      return updated;
    });

    // Update categories for expenses
    const expenseTxs = createdTxs.filter((tx) => tx.type === 'expense');
    if (expenseTxs.length > 0) {
      setCategories((prev) => {
        const updated = prev.map((c) => {
          const added = expenseTxs
            .filter((tx) => tx.categoryKey === c.key)
            .reduce((sum, tx) => sum + tx.amount, 0);
          return { ...c, amount: c.amount + added };
        });
        const newTotal = updated.reduce((sum, c) => sum + c.amount, 0);
        return updated.map((c) => ({
          ...c,
          percentage: newTotal > 0 ? Math.round((c.amount / newTotal) * 100) : 0,
        }));
      });
    }

    // Notify FIN AI
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-import-${Date.now()}`,
        sender: 'fin',
        text: `Extrato processado com sucesso! Foram importadas ${createdTxs.length} transações salvas permanentemente na nuvem. Todos os saldos e relatórios já foram atualizados.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Toggle bill / invoice / recurring payment status
  const handleToggleBillStatus = (id: string, newStatus: 'paid' | 'pending') => {
    triggerSuccessFeedback();
    let fixedIdToSync: string | undefined;

    setTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (tx.id === id) {
          if (tx.fixedExpenseId) fixedIdToSync = tx.fixedExpenseId;
          const updatedTx = { ...tx, status: newStatus };
          saveCloudTransaction(updatedTx);
          return updatedTx;
        }
        return tx;
      });
      return updated;
    });

    if (fixedIdToSync) {
      setFixedExpenses((prev) => {
        const updated = prev.map((fe) => {
          if (fe.id === fixedIdToSync) {
            const updatedFe = { ...fe, status: newStatus };
            saveCloudFixedExpense(updatedFe);
            return updatedFe;
          }
          return fe;
        });
        try {
          localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  // Create Fixed Expense & Generate Corresponding Transaction
  const handleCreateFixedExpense = (newItem: FixedExpenseItem) => {
    triggerSuccessFeedback();

    // 1. Update and persist Fixed Expense (State, LocalStorage & Firestore)
    setFixedExpenses((prev) => {
      const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
      try {
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    saveCloudFixedExpense(newItem);

    // 2. Generate Corresponding Transaction in state & Firestore
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const validDay = Math.min(Math.max(1, newItem.dueDay || 1), daysInMonth);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
    const dateFormatted = `${String(validDay).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;

    const targetBank = banks.find((b) => b.slug === newItem.bankSlug) || banks[0];
    const catKey = getCategoryKey(newItem.category);

    const correspondingTx: Transaction = {
      id: `tx-fix-${newItem.id}`,
      title: newItem.title,
      amount: newItem.amount,
      type: 'expense',
      category: newItem.category,
      categoryKey: catKey,
      date: dateFormatted,
      rawDate: dateStr,
      dueDate: dateStr,
      bankId: targetBank ? targetBank.id : 'bank-nubank',
      bankName: targetBank ? targetBank.name : (newItem.bankName || 'Nubank'),
      bankSlug: newItem.bankSlug,
      isRecurring: true,
      isFixedExpense: true,
      recurrencePeriod: newItem.frequency || 'monthly',
      status: newItem.status || 'pending',
      barcode: newItem.barcode,
      fixedExpenseId: newItem.id,
    };

    setTransactions((prev) => [
      correspondingTx,
      ...prev.filter((t) => t.id !== correspondingTx.id && t.fixedExpenseId !== newItem.id),
    ]);
    saveCloudTransaction(correspondingTx);

    // 3. Update Categories (immediately reflects in expense breakdown)
    setCategories((prev) => {
      const updated = prev.map((c) =>
        c.key === catKey ? { ...c, amount: c.amount + newItem.amount } : c
      );
      const newTotal = updated.reduce((s, c) => s + c.amount, 0);
      return updated.map((c) => ({
        ...c,
        percentage: newTotal > 0 ? Math.round((c.amount / newTotal) * 100) : 0,
      }));
    });

    // 4. If created as already paid, deduct immediately from the bank balance
    if (newItem.status === 'paid' && targetBank) {
      setBanks((prev) => {
        const updated = prev.map((b) => {
          if (b.id === targetBank.id) {
            return {
              ...b,
              balance: b.balance - newItem.amount,
              availableBalance: b.availableBalance - newItem.amount,
              lastSync: 'Agora',
            };
          }
          return b;
        });
        saveCloudBanksBatch(updated);
        return updated;
      });
    }

    // 5. Notify FIN AI
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-fixed-${Date.now()}`,
        sender: 'fin',
        text: `Despesa fixa "${newItem.title}" de R$ ${newItem.amount.toFixed(2)} cadastrada com sucesso! Lançamento gerado no extrato e calendário para o dia ${validDay}/${currentMonth + 1}, impactando seu saldo projetado.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Update Fixed Expenses Handler with local storage and cloud sync
  const handleUpdateFixedExpenses = (
    newExpenses: FixedExpenseItem[] | ((prev: FixedExpenseItem[]) => FixedExpenseItem[])
  ) => {
    setFixedExpenses((prev) => {
      const updated = typeof newExpenses === 'function' ? newExpenses(prev) : newExpenses;
      try {
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      saveCloudFixedExpensesBatch(updated);
      return updated;
    });
  };

  // Toggle Fixed Expense Status
  const handleToggleFixedExpenseStatus = (id: string, newStatus: 'paid' | 'pending') => {
    triggerSuccessFeedback();
    let affectedItem: FixedExpenseItem | undefined;

    setFixedExpenses((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          affectedItem = item;
          const itemUpdated = { ...item, status: newStatus };
          saveCloudFixedExpense(itemUpdated);
          return itemUpdated;
        }
        return item;
      });
      try {
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Synchronize corresponding transaction status
    setTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (tx.fixedExpenseId === id || tx.id === `tx-fix-${id}`) {
          const updatedTx: Transaction = { ...tx, status: newStatus };
          saveCloudTransaction(updatedTx);
          return updatedTx;
        }
        return tx;
      });
      return updated;
    });

    // If status changed, reflect in bank balance
    if (affectedItem) {
      const targetSlug = affectedItem.bankSlug;
      const amount = affectedItem.amount;
      const isNowPaid = newStatus === 'paid';

      setBanks((prev) => {
        const updated = prev.map((b) => {
          if (b.slug === targetSlug) {
            const delta = isNowPaid ? -amount : amount;
            return {
              ...b,
              balance: b.balance + delta,
              availableBalance: b.availableBalance + delta,
              lastSync: 'Agora',
            };
          }
          return b;
        });
        saveCloudBanksBatch(updated);
        return updated;
      });
    }
  };

  // Delete Fixed Expense
  const handleDeleteFixedExpense = (id: string) => {
    let deletedItem: FixedExpenseItem | undefined;

    setFixedExpenses((prev) => {
      const target = prev.find((item) => item.id === id);
      deletedItem = target;
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    deleteCloudFixedExpense(id);

    // Delete corresponding transaction
    setTransactions((prev) => {
      const txToDelete = prev.find((tx) => tx.fixedExpenseId === id || tx.id === `tx-fix-${id}`);
      if (txToDelete) {
        deleteCloudTransaction(txToDelete.id);
      }
      return prev.filter((tx) => tx.fixedExpenseId !== id && tx.id !== `tx-fix-${id}`);
    });

    // If was paid, refund to bank balance
    if (deletedItem && deletedItem.status === 'paid') {
      const targetSlug = deletedItem.bankSlug;
      const refundAmount = deletedItem.amount;
      setBanks((prev) => {
        const updated = prev.map((b) => {
          if (b.slug === targetSlug) {
            return {
              ...b,
              balance: b.balance + refundAmount,
              availableBalance: b.availableBalance + refundAmount,
              lastSync: 'Agora',
            };
          }
          return b;
        });
        saveCloudBanksBatch(updated);
        return updated;
      });
    }
  };

  // Add new bank
  const handleAddBank = (newBankData: Partial<BankAccount>) => {
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      name: newBankData.name || 'Novo Banco',
      slug: newBankData.slug || 'nubank',
      balance: newBankData.balance || 500,
      availableBalance: newBankData.availableBalance || 500,
      accountType: 'corrente',
      accountNumber: newBankData.accountNumber || '10293-4',
      agency: '0001',
      color: '#10b981',
      glowColor: 'cyan',
      lastSync: 'Agora',
      status: 'connected',
      autoSync: true,
      ...newBankData,
    };
    setBanks((prev) => [...prev, newBank]);
    saveCloudBank(newBank);
  };

  const handleRemoveBank = (bankId: string) => {
    const bankToRemove = banks.find((b) => b.id === bankId);
    setBanks((prev) => prev.filter((b) => b.id !== bankId));
    deleteCloudBank(bankId);
    if (bankToRemove && selectedBankSlug === bankToRemove.slug) {
      setSelectedBankSlug(null);
    }
  };

  // Render Profiles View when active
  if (isProfilesScreenOpen) {
    return (
      <ProfilesView
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleProfileSwitch}
        onAddProfile={(newProfileData) => {
          const newP: UserProfile = {
            ...newProfileData,
            id: `profile-${Date.now()}`,
          };
          setProfiles((prev) => [...prev, newP]);
          saveCloudProfile(newP);
          setActiveProfileId(newP.id);
          setIsProfilesScreenOpen(false);
        }}
        onUpdateProfile={(updatedProfile) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
          );
          saveCloudProfile(updatedProfile);
        }}
        onDeleteProfile={(id) => {
          setProfiles((prev) => {
            const filtered = prev.filter((p) => p.id !== id);
            if (activeProfileId === id && filtered.length > 0) {
              setActiveProfileId(filtered[0].id);
            }
            return filtered;
          });
          deleteCloudProfile(id);
        }}
        onBackToDashboard={() => {
          setIsProfilesScreenOpen(false);
        }}
      />
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Prevent flickering when dragging over child elements
    // We only hide if the user actually leaves the window
    if (e.currentTarget === e.target || (e.relatedTarget === null)) {
       setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setDroppedFile(file);
      setIsUploadStatementModalOpen(true);
    }
  };

  return (
  <div 
    className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col lg:flex-row antialiased"
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
            {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <div className="w-[90vw] h-[90vh] border-4 border-dashed border-cyan-400/80 rounded-3xl flex flex-col items-center justify-center bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-none">
              <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <FileText className="w-12 h-12 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 text-center">Solte seu extrato aqui para a IA analisar</h2>
              <p className="text-lg text-cyan-200/70 text-center">Apenas arquivos PDF são aceitos.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        lastSyncTime={lastSyncTime}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeProfile={activeProfile}
        onOpenProfiles={() => setIsProfilesScreenOpen(true)}
        cloudStatus={cloudStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 lg:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          {/* Mobile Menu Button & Greeting */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 lg:hidden text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block">
                {currentTab === 'relatorios'
                  ? 'RELATÓRIOS & ANALYTICS'
                  : currentTab === 'calendario' || currentTab === 'cartoes'
                  ? 'CALENDÁRIO & FATURAS'
                  : currentTab === 'transacoes'
                  ? 'TRANSAÇÕES DETALHADAS'
                  : currentTab === 'contas'
                  ? 'CONTAS & CARTEIRAS'
                  : currentTab === 'despesas-fixas'
                  ? 'DESPESAS FIXAS & ASSINATURAS'
                  : 'VISÃO GERAL'}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Olá, {activeProfile.name}!</span>
                <span className="text-base">👋</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {currentTab === 'relatorios'
                  ? 'Análise detalhada de receitas, despesas e fluxo mensal'
                  : currentTab === 'calendario' || currentTab === 'cartoes'
                  ? 'Vencimentos de cartões, faturas e compromissos do mês'
                  : currentTab === 'transacoes'
                  ? 'Histórico completo de lançamentos e extrato financeiro'
                  : currentTab === 'contas'
                  ? 'Gerenciamento de contas bancárias e saldos'
                  : currentTab === 'despesas-fixas'
                  ? 'Contas recorrentes com débito programado'
                  : 'Aqui está o resumo das suas finanças'}
              </p>
            </div>
          </div>

          {/* Right Header Controls: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Action: New Transaction Button */}
            <button
              id="btn-topbar-nova-transacao"
              onClick={() => setIsNewTransactionModalOpen(true)}
              className="Button"
              title="Adicionar Nova Transação"
            >
              <svg  
                className="Button-svg"
                width="180" 
                height="45" 
                viewBox="0 0 300 80"
              >
                <rect 
                  className="Button-line Button-line--outer"
                  strokeWidth="8"
                  stroke="#06B6D4" 
                  strokeLinecap="round"
                  fill="none" 
                  x="4" 
                  y="4" 
                  width="292" 
                  height="72" 
                  rx="36"
                  pathLength="100"
                />
                <rect 
                  className="Button-line Button-line--inner"
                  strokeWidth="4"
                  stroke="#3B82F6" 
                  strokeLinecap="round"
                  fill="none" 
                  x="4" 
                  y="4" 
                  width="292" 
                  height="72" 
                  rx="36"
                  pathLength="100"
                />
              </svg>
              <div className="Button-content">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nova Transação</span>
              </div>
            </button>

            {/* Profile Dropdown Container anchored to header-profile-btn */}
            <div className="relative">
              <button
                id="header-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                title={`Perfil atual: ${activeProfile.name} • Opções rápidas`}
                aria-haspopup="true"
                aria-expanded={profileDropdownOpen}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl transition-all group shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  profileDropdownOpen
                    ? 'bg-slate-800/95 border border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-[0_0_12px_rgba(var(--theme-glow-rgb),0.25)]'
                    : 'bg-[#0a1224] hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400/60'
                }`}
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-cyan-400/60 shadow-sm flex-shrink-0">
                  <RenderProfileAvatar avatarId={activeProfile.avatarId} />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 hidden sm:inline-block">
                  {activeProfile.name}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              <ProfileDropdown
                isOpen={profileDropdownOpen}
                onClose={() => setProfileDropdownOpen(false)}
                activeProfile={activeProfile}
                profiles={profiles}
                onSelectProfile={handleProfileSwitch}
                onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
                onOpenAccountSettings={() => setIsAccountSettingsModalOpen(true)}
                onOpenAllProfiles={() => setIsProfilesScreenOpen(true)}
                onLogout={() => {
                  setIsProfilesScreenOpen(true);
                }}
                onRestoreDemoData={handleRestoreDemoData}
                onZeroAllValues={handleZeroAllValues}
              />
            </div>
          </div>
        </header>

        {/* Dynamic View Switcher with Smooth Tab Transition */}
        <AnimatePresence mode="wait" initial={false}>
          {currentTab === 'transacoes' ? (
            <motion.div
              key="tab-transacoes"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col"
            >
              <FullTransactionsView
                transactions={transactions}
                onBackToOverview={() => setCurrentTab('visao-geral')}
                onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
                onOpenVoiceTransaction={() => setIsVoiceModalOpen(true)}
                onOpenImportStatement={() => setIsImportStatementModalOpen(true)}
              />
            </motion.div>
          ) : currentTab === 'contas' ? (
            <motion.div
              key="tab-contas"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col"
            >
              <AccountsView
                banks={banks}
                onBackToOverview={() => setCurrentTab('visao-geral')}
                onConnectNewBank={() => setIsUploadStatementModalOpen(true)}
                onSyncBank={handleTriggerSync}
                onRemoveBank={handleRemoveBank}
                onSaveBalance={handleSaveBankBalance}
              />
            </motion.div>
          ) : currentTab === 'despesas-fixas' ? (
            <motion.div
              key="tab-despesas-fixas"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col"
            >
              <FixedExpensesView
                banks={banks}
                expenses={fixedExpenses}
                onCreateExpense={handleCreateFixedExpense}
                onUpdateExpenses={handleUpdateFixedExpenses}
                onDeleteExpense={handleDeleteFixedExpense}
                onToggleStatus={handleToggleFixedExpenseStatus}
                onBackToOverview={() => setCurrentTab('visao-geral')}
              />
            </motion.div>
          ) : currentTab === 'relatorios' ? (
            <motion.div
              key="tab-relatorios"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col"
            >
              <ReportsView
                banks={banks}
                transactions={transactions}
                activeProfile={activeProfile}
                onBackToOverview={() => setCurrentTab('visao-geral')}
              />
            </motion.div>
          ) : currentTab === 'calendario' || currentTab === 'cartoes' ? (
            <motion.div
              key="tab-calendario"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex-1 flex flex-col"
            >
              <CalendarView
                transactions={transactions}
                banks={banks}
                fixedExpenses={fixedExpenses}
                onBackToOverview={() => setCurrentTab('visao-geral')}
                onAddTransaction={handleAddTransaction}
                onToggleStatus={handleToggleBillStatus}
                onToggleFixedExpenseStatus={handleToggleFixedExpenseStatus}
              />
            </motion.div>
          ) : ( 
            /* DEFAULT: VISÃO GERAL (Matches screenshot exactly) */
            <motion.div 
              key="tab-visao-geral"
              variants={tabTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 w-full flex-1 flex flex-col"
            >
              <motion.div 
                className="space-y-4 flex-1 flex flex-col"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {/* DYNAMIC LAYOUT ENGINE */}
                <motion.div variants={itemVariant} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 flex-1 items-stretch">
                  {dashboardWidgets.map((widget) => {
                    if (!widget.visible) return null;

                    switch (widget.id) {
                      case 'assistant':
                        return (
                          <div key={widget.id} className="col-span-1 lg:col-span-7 h-full flex flex-col">
                            <FinHeroAssistant
                              isLoading={isSyncing}
                              onAskQuestion={handleAskFIN}
                              latestAnswer={latestFinAnswer}
                              onOpenFullChat={() => setIsChatModalOpen(true)}
                            />
                          </div>
                        );
                      case 'summary':
                        return (
                          <div key={widget.id} className="col-span-1 lg:col-span-5 h-full flex flex-col">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedBankSlug || 'all'}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                              >
                              <SummaryCards isLoading={isSyncing}
                              summary={summary}
                              onChangePeriod={(p) => console.log('Period changed:', p)}
                              onOpenAccounts={() => setCurrentTab('contas')}
                            />
                            </motion.div>
                            </AnimatePresence>
                          </div>
                        );
                      case 'banks':
                        return (
                          <div key={widget.id} className="col-span-1 lg:col-span-12">
                            <ConnectedBanks
                              banks={banks}
                              selectedBankSlug={selectedBankSlug}
                              onSelectBank={(slug) => setSelectedBankSlug(slug)}
                              onSyncBank={handleTriggerSync}
                              onConnectNewBank={() => setIsUploadStatementModalOpen(true)}
                              onRemoveBank={handleRemoveBank}
                              onSaveBalance={handleSaveBankBalance}
                              isSyncingAll={isSyncing}
                            />
                          </div>
                        );
                      case 'donut':
                        return (
                          <div key={widget.id} className="col-span-1 md:col-span-6 lg:col-span-4 h-full flex flex-col">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedBankSlug || 'all'}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                              >
                              <CategoryDonutChart isLoading={isSyncing}
                              categories={categories}
                              totalExpenses={totalDespesas}
                              onViewReport={() => setCurrentTab('transacoes')}
                            />
                            </motion.div>
                            </AnimatePresence>
                          </div>
                        );
                      case 'evolution':
                        return (
                          <div key={widget.id} className="col-span-1 md:col-span-6 lg:col-span-4 h-full flex flex-col">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedBankSlug || 'all'}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                              >
                              <FinancialEvolutionChart isLoading={isSyncing}
                              data={computedEvolutionPoints}
                              onViewAnalysis={() => setIsChatModalOpen(true)}
                            />
                            </motion.div>
                            </AnimatePresence>
                          </div>
                        );
                      case 'transactions':
                        return (
                          <div key={widget.id} className="col-span-1 md:col-span-12 lg:col-span-4 h-full flex flex-col">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedBankSlug || 'all'}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                              >
                              <RecentTransactions isLoading={isSyncing}
                              transactions={displayedTransactions}
                              onViewAll={() => setCurrentTab('transacoes')}
                              onSelectTransaction={(tx) => {
                                handleAskFIN(`O que você pode me dizer sobre o gasto de ${formatValue(tx.amount)} em ${tx.title}?`);
                              }}
                            />
                            </motion.div>
                            </AnimatePresence>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <UploadStatementModal
          isOpen={isUploadStatementModalOpen}
          droppedFile={droppedFile}
          onClose={() => {
            setIsUploadStatementModalOpen(false);
            setDroppedFile(null);
          }}
          onTransactionsParsed={(newTxs, bankSlug, finalBalance) => {
             setTransactions(prev => [...newTxs, ...prev]);
             saveCloudTransactionsBatch(newTxs);
             
             if (bankSlug) {
               setBanks(prevBanks => {
                 const existingIndex = prevBanks.findIndex(b => b.slug === bankSlug);
                 let updated = [...prevBanks];
                 const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                 
                 if (existingIndex >= 0) {
                   updated = prevBanks.map(b => 
                     b.slug === bankSlug 
                       ? { 
                           ...b, 
                           ...(finalBalance !== undefined && finalBalance !== null ? { balance: finalBalance, availableBalance: finalBalance } : {}), 
                           lastSync: currentTime 
                         } 
                       : b
                   );
                 } else {
                   const bankNameMap: Record<string, string> = {
                     inter: 'INTER',
                     itau: 'ITAÚ',
                     bradesco: 'BRADESCO',
                     'santander-pf': 'SANTANDER PF',
                     nubank: 'NUBANK',
                     c6: 'C6 BANK',
                   };
                   const newBank: BankAccount = {
                     id: `bank-${bankSlug}`,
                     name: bankNameMap[bankSlug] || bankSlug.toUpperCase(),
                     slug: bankSlug as any,
                     balance: (finalBalance !== undefined && finalBalance !== null) ? finalBalance : 0,
                     availableBalance: (finalBalance !== undefined && finalBalance !== null) ? finalBalance : 0,
                     accountType: 'corrente',
                     accountNumber: '10984-2',
                     agency: '0001',
                     color: bankSlug === 'inter' ? '#ff7a00' : '#00e5ff',
                     glowColor: 'orange',
                     lastSync: currentTime,
                     status: 'connected',
                     autoSync: true,
                   };
                   updated.push(newBank);
                 }
                 saveCloudBanksBatch(updated);
                 return updated;
               });
             }

             setChatMessages(prev => [
                ...prev,
                {
                   id: `msg-pdf-${Date.now()}`,
                   sender: 'fin',
                   text: `Acabei de importar ${newTxs.length} transações do seu extrato e sincronizá-las na nuvem. Seus painéis e saldos já estão salvos permanentemente!`,
                   timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                }
             ]);
          }}
        />

        <NewTransactionModal
          isOpen={isNewTransactionModalOpen}
          onClose={() => setIsNewTransactionModalOpen(false)}
          banks={banks}
          onAddTransaction={handleAddTransaction}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenImportModal={() => setIsImportStatementModalOpen(true)}
        />

        <VoiceTransactionModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          banks={banks}
          onAddTransaction={handleAddTransaction}
        />

        <ImportStatementModal
          isOpen={isImportStatementModalOpen}
          onClose={() => setIsImportStatementModalOpen(false)}
          banks={banks}
          onImportTransactions={handleImportMultipleTransactions}
        />

        <FinChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          messages={chatMessages}
          onSendMessage={async (text) => {
            await handleAskFIN(text);
          }}
          onClearHistory={() =>
            setChatMessages([
              {
                id: 'msg-init-cleared',
                sender: 'fin',
                text: 'Histórico redefinido. Como posso ajudar com suas finanças agora, Roberto?',
                timestamp: 'Agora',
              },
            ])
          }
        />

        {/* Profile Quick Management Modals directly on Dashboard */}
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          profile={activeProfile}
          totalProfilesCount={profiles.length}
          onSaveProfile={(updatedProfile) => {
            setProfiles((prev) =>
              prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
            );
            saveCloudProfile(updatedProfile);
          }}
          onDeleteProfile={(id) => {
            setProfiles((prev) => {
              const filtered = prev.filter((p) => p.id !== id);
              if (activeProfileId === id && filtered.length > 0) {
                setActiveProfileId(filtered[0].id);
              }
              return filtered;
            });
            deleteCloudProfile(id);
          }}
        />

        <AccountSettingsModal
          isOpen={isAccountSettingsModalOpen}
          onClose={() => setIsAccountSettingsModalOpen(false)}
          profile={activeProfile}
          categories={categories}
          setCategories={setCategories}
        />
      </main>
      
      {/* Profile Switching Loading Overlay */}
      {isProfileLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050a14]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(var(--theme-glow-rgb),0.5)] flex flex-col items-center justify-center mb-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse"></div>
            <div className="w-6 h-6 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 animate-pulse">
            Carregando dados bancários...
          </h2>
          <p className="text-sm text-slate-400">
            Carregando base de extratos importados
          </p>
        </div>
      )}
    </div>
  );
}
