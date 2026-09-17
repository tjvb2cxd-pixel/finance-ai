import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  LogOut, 
  X, 
  Send,
  CalendarDays,
  BellRing,
  Check,
  ShieldCheck
} from 'lucide-react';
import { 
  initGoogleCalendarAuth, 
  signInWithGoogleCalendar, 
  disconnectGoogleCalendar, 
  getGoogleCalendarToken, 
  syncBillToGoogleCalendar,
  getSyncedBillsMap,
  fetchCloudSyncedBillsMap,
  GoogleAccountProfile
} from '../lib/googleCalendar';
import { Transaction, FixedExpenseItem } from '../types';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  fixedExpenses?: FixedExpenseItem[];
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  fixedExpenses = [],
}) => {
  const [user, setUser] = useState<GoogleAccountProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [syncedMap, setSyncedMap] = useState<Record<string, string>>(() => getSyncedBillsMap());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reminderOption, setReminderOption] = useState<'1day' | '2days' | 'sameday'>('1day');

  useEffect(() => {
    fetchCloudSyncedBillsMap().then((m) => setSyncedMap(m));
    const unsubscribe = initGoogleCalendarAuth(
      (authedUser, authedToken) => {
        setUser(authedUser);
        setToken(authedToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, [isOpen]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogleCalendar();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSyncStatusMsg(`Conectado como ${res.user.email} (Persistência Ativa)`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Não foi possível conectar ao Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Deseja realmente desconectar sua conta Google do calendário financeiro?')) {
      await disconnectGoogleCalendar();
      setUser(null);
      setToken(null);
      setSyncStatusMsg('Conta Google desconectada com sucesso.');
    }
  };

  // Compile list of upcoming bills/recurring items for current & upcoming period
  const upcomingBills = React.useMemo(() => {
    const list: {
      id: string;
      title: string;
      amount: number;
      date: string;
      category: string;
      bankName: string;
      type: string;
    }[] = [];

    // 1. From fixed expenses
    fixedExpenses.forEach((fe) => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = Math.min(Math.max(1, fe.dueDay || 1), 28);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      list.push({
        id: `fe-${fe.id}`,
        title: fe.title,
        amount: fe.amount,
        date: dateStr,
        category: fe.category,
        bankName: fe.bankName || 'Conta Fixa',
        type: 'Despesa Fixa',
      });
    });

    // 2. From invoices/recurring transactions
    transactions
      .filter((t) => t.isInvoice || t.isRecurring || t.type === 'expense')
      .slice(0, 15)
      .forEach((tx) => {
        list.push({
          id: `tx-${tx.id}`,
          title: tx.title,
          amount: tx.amount,
          date: tx.dueDate || tx.rawDate || new Date().toISOString().split('T')[0],
          category: tx.category,
          bankName: tx.bankName,
          type: tx.isInvoice ? 'Fatura Cartão' : 'Conta/Boleto',
        });
      });

    return list;
  }, [fixedExpenses, transactions]);

  // Sync individual bill
  const handleSyncSingleBill = async (bill: typeof upcomingBills[0]) => {
    let currentToken = token || getGoogleCalendarToken();
    if (!currentToken) {
      const res = await signInWithGoogleCalendar();
      if (!res) return;
      currentToken = res.accessToken;
      setToken(currentToken);
      setUser(res.user);
    }

    setSyncingItemId(bill.id);
    setErrorMsg(null);

    const reminderMinutes = reminderOption === 'sameday' ? 60 : reminderOption === '2days' ? 2880 : 1440;

    try {
      const formattedAmount = bill.amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      const res = await syncBillToGoogleCalendar(
        {
          id: bill.id,
          summary: `💸 Vencimento: ${bill.title} (${formattedAmount})`,
          description: `Compromisso financeiro agendado:\n• Valor: ${formattedAmount}\n• Categoria: ${bill.category}\n• Instituição: ${bill.bankName}\n• Tipo: ${bill.type}`,
          startDate: bill.date,
          amount: bill.amount,
          bankName: bill.bankName,
          reminderMinutes,
        },
        currentToken
      );

      if (res.success && res.eventLink) {
        setSyncedMap((prev) => ({ ...prev, [bill.id]: res.eventLink! }));
        setSyncStatusMsg(`"${bill.title}" sincronizado na sua Agenda Google!`);
      } else {
        setErrorMsg(res.error || 'Falha ao sincronizar item');
        if (res.error?.includes('authentication') || res.error?.includes('OAuth') || res.error?.includes('401') || res.error?.includes('credenciais')) {
          setToken(null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao sincronizar com Google Agenda');
      if (err.message?.includes('authentication') || err.message?.includes('OAuth') || err.message?.includes('401') || err.message?.includes('credenciais')) {
        setToken(null);
      }
    } finally {
      setSyncingItemId(null);
    }
  };

  // Sync all bills to Google Calendar
  const handleSyncAllBills = async () => {
    let currentToken = token || getGoogleCalendarToken();
    if (!currentToken) {
      const res = await signInWithGoogleCalendar();
      if (!res) return;
      currentToken = res.accessToken;
      setToken(currentToken);
      setUser(res.user);
    }

    setIsSyncingAll(true);
    setErrorMsg(null);
    setSyncStatusMsg('Sincronizando vencimentos na sua Agenda do Google...');
    let successCount = 0;
    const newSynced = { ...syncedMap };
    const reminderMinutes = reminderOption === 'sameday' ? 60 : reminderOption === '2days' ? 2880 : 1440;

    try {
      for (const bill of upcomingBills) {
        const formattedAmount = bill.amount.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
        const res = await syncBillToGoogleCalendar(
          {
            id: bill.id,
            summary: `💸 Vencimento: ${bill.title} (${formattedAmount})`,
            description: `Compromisso financeiro agendado:\n• Valor: ${formattedAmount}\n• Categoria: ${bill.category}\n• Instituição: ${bill.bankName}\n• Tipo: ${bill.type}`,
            startDate: bill.date,
            amount: bill.amount,
            bankName: bill.bankName,
            reminderMinutes,
          },
          currentToken
        );
        if (res.success && res.eventLink) {
          successCount++;
          newSynced[bill.id] = res.eventLink;
        } else if (res.error && (res.error.includes('authentication') || res.error.includes('OAuth') || res.error.includes('401') || res.error.includes('credenciais'))) {
          setToken(null);
          throw new Error('Sua credencial do Google expirou ou precisa de autorização. Clique em "Conectar Google" para renovar.');
        }
      }

      setSyncedMap(newSynced);
      setSyncStatusMsg(`${successCount} vencimento(s) sincronizados com a sua Agenda do Google!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro durante a sincronização em lote');
    } finally {
      setIsSyncingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#070e1e] border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(6,182,212,0.2)] flex flex-col text-slate-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Google Calendar</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                    Sincronização
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Agende lembretes e vencimentos diretamente na sua agenda pessoal
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connection Status Card */}
          <div className="my-4 p-4 rounded-xl bg-[#0a1224] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google'}
                  className="w-10 h-10 rounded-full border border-cyan-500/40 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    user
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {user ? (
                    user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'G'
                  ) : (
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white block">
                    {user ? (user.displayName || user.email) : 'Conta Google não conectada'}
                  </span>
                  {user && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Conta Salva e Persistente</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {user ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          token ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                        }`}
                      />
                      <span>
                        {user.email} • {token ? 'Sessão Google Ativa' : 'Sessão requer renovação'}
                      </span>
                    </span>
                  ) : (
                    'Conecte sua conta para manter o calendário sincronizado na nuvem'
                  )}
                </span>
                {user?.lastSyncAt && (
                  <span className="text-[10px] text-cyan-400/80 block mt-0.5">
                    Última sincronização: {new Date(user.lastSyncAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2 flex-wrap">
                {!token && (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                    <span>Renovar Sessão</span>
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.98 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                )}
                <span>Conectar com Google</span>
              </button>
            )}
          </div>

          {/* Preferences */}
          <div className="mb-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <BellRing className="w-4 h-4 text-cyan-400" />
              <span>Lembrete no Google Calendar:</span>
            </div>
            <select
              value={reminderOption}
              onChange={(e) => setReminderOption(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 outline-none focus:border-cyan-400"
            >
              <option value="1day">1 dia e 1 hora antes</option>
              <option value="2days">2 dias antes</option>
              <option value="sameday">No dia do vencimento (9h)</option>
            </select>
          </div>

          {/* Status / Feedback alerts */}
          {syncStatusMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* List Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Vencimentos disponíveis para agenda:</span>
              <span className="font-mono text-cyan-400">{upcomingBills.length} itens</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {upcomingBills.map((b) => {
                const isSynced = !!syncedMap[b.id];
                const isThisSyncing = syncingItemId === b.id;

                return (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white block truncate">{b.title}</span>
                        {isSynced && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Na Agenda
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {b.bankName} • Vencimento: {b.date.split('-').reverse().join('/')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-cyan-300 text-xs">
                        {b.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>

                      {isSynced ? (
                        <a
                          href={syncedMap[b.id]}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 transition-colors"
                          title="Abrir no Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleSyncSingleBill(b)}
                          disabled={isThisSyncing}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1"
                        >
                          {isThisSyncing ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                          ) : (
                            <CalendarIcon className="w-3 h-3" />
                          )}
                          <span>Agendar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Abrir Google Agenda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Fechar
              </button>

              <button
                onClick={handleSyncAllBills}
                disabled={isSyncingAll}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSyncingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Sincronizar Todos</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
