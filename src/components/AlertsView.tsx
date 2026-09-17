import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, CreditCard, FileText, CheckCircle2, AlertCircle, Clock, Copy, Check } from 'lucide-react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { BankSlug } from '../types';
import { BankLogo } from './BankLogos';
import { NewBillModal } from './NewBillModal';
import { Plus } from 'lucide-react';

export interface Bill {
  id: string;
  title: string;
  type: 'cartao' | 'boleto';
  dueDate: string; // YYYY-MM-DD
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  bankSlug?: BankSlug;
  barcode?: string;
}

const MOCK_BILLS: Bill[] = [];
const LOCAL_BILLS_KEY = 'finance_alerts_bills_v2';

interface AlertsViewProps {
  onBackToOverview: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onBackToOverview }) => {
  const { formatValue } = usePrivacy();
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_BILLS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return MOCK_BILLS;
  });

  const updateBills = (newBills: Bill[] | ((prev: Bill[]) => Bill[])) => {
    setBills(prev => {
      const updated = typeof newBills === 'function' ? newBills(prev) : newBills;
      try {
        localStorage.setItem(LOCAL_BILLS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const [filter, setFilter] = useState<'all' | 'cartao' | 'boleto'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBills = bills.filter(b => filter === 'all' || b.type === filter);

  // Sorting: Overdue first, then pending, then paid
  const sortedBills = [...filteredBills].sort((a, b) => {
    const statusWeight = { overdue: 0, pending: 1, paid: 2 };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleAddBill = (newBill: Omit<Bill, 'id' | 'status'>) => {
    const bill: Bill = {
      ...newBill,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
    };
    updateBills(prev => [...prev, bill]);
  };

  const handleCopy = (barcode: string, id: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkPaid = (id: string) => {
    updateBills(prev => prev.map(b => b.id === id ? { ...b, status: 'paid' } : b));
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'overdue': return 'text-red-400 bg-red-400/10 border-red-500/30';
      case 'paid': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
      case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-500/30';
    }
  };

  const getStatusIcon = (status: Bill['status']) => {
    switch (status) {
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <button
          onClick={onBackToOverview}
          className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Alertas e Vencimentos
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Acompanhe e gerencie suas contas a pagar</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-xl font-bold transition-colors text-sm shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Vencimento</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#0b1325]/90 border border-slate-800/90 rounded-xl backdrop-blur-md w-fit">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'cartao', label: 'Cartões' },
          { id: 'boleto', label: 'Boletos' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              filter === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedBills.map((bill) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={bill.id}
              className={`bg-[#0b1325]/90 border rounded-2xl p-5 shadow-lg backdrop-blur-md transition-colors ${
                bill.status === 'overdue' ? 'border-red-500/30' : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#060c18] border border-slate-800 flex items-center justify-center flex-shrink-0">
                    {bill.type === 'cartao' && bill.bankSlug ? (
                      <BankLogo slug={bill.bankSlug} size={24} className="rounded" />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-200">{bill.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                      <span className="text-slate-400 flex items-center gap-1">
                        Vencimento: <span className="text-slate-200">{formatDate(bill.dueDate)}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className={`px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(bill.status)}`}>
                        {getStatusIcon(bill.status)}
                        {bill.status === 'overdue' ? 'Atrasado' : bill.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0">
                  <span className="text-xl font-black text-white font-mono tracking-tight">
                    {formatValue(bill.amount)}
                  </span>
                  
                  {bill.status !== 'paid' && (
                    <div className="flex items-center gap-2">
                      {bill.type === 'boleto' && bill.barcode && (
                        <button
                          onClick={() => handleCopy(bill.barcode!, bill.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                        >
                          {copiedId === bill.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === bill.id ? 'Copiado!' : 'Copiar Código'}
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marcar como Pago
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {sortedBills.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-[#0b1325]/50 border border-slate-800/50 rounded-2xl"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Nenhum vencimento encontrado.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <NewBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBill={handleAddBill}
      />
    </div>
  );
};
