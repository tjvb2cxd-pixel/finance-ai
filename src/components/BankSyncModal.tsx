import React, { useState } from 'react';
import { BankAccount, BankSlug } from '../types';
import { BankLogo } from './BankLogos';
import { X, RefreshCw, CheckCircle2, ShieldCheck, Link2, Plus, Zap, AlertCircle } from 'lucide-react';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: BankAccount[];
  onAddBank: (bankData: Partial<BankAccount>) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose,
  banks,
  onAddBank,
  onSyncAll,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'connect' | 'settings'>('status');
  const [selectedNewBank, setSelectedNewBank] = useState<BankSlug | null>(null);
  const [connectingStep, setConnectingStep] = useState<number>(0); // 0: select, 1: auth, 2: success
  const [syncInterval, setSyncInterval] = useState('15m');

  if (!isOpen) return null;

  const availableBanksToConnect: { slug: BankSlug; name: string; type: string }[] = [
    { slug: 'itau', name: 'Itaú Personalité', type: 'Conta Adicional' },
    { slug: 'bradesco', name: 'Bradesco Prime', type: 'Conta Corrente' },
    { slug: 'santander-pf', name: 'Santander Select', type: 'Conta Corrente' },
  ];

  const handleStartConnect = (slug: BankSlug) => {
    setSelectedNewBank(slug);
    setConnectingStep(1);

    // Simulate Open Finance handshake
    setTimeout(() => {
      setConnectingStep(2);
      setTimeout(() => {
        const bankName = availableBanksToConnect.find((b) => b.slug === slug)?.name || 'Novo Banco';
        onAddBank({
          name: bankName,
          slug: slug,
          balance: Math.floor(Math.random() * 1500) + 200,
          availableBalance: Math.floor(Math.random() * 1500) + 200,
          accountType: 'corrente',
          accountNumber: `${Math.floor(Math.random() * 89999) + 10000}-1`,
          agency: '0001',
          color: '#10b981',
          glowColor: 'cyan',
          lastSync: 'Agora',
          status: 'connected',
          autoSync: true,
        });
        setConnectingStep(0);
        setSelectedNewBank(null);
        setActiveTab('status');
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1325] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Integração Bancária Automática</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Open Finance Brasil
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sincronização contínua de extratos e saldos em tempo real
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

        {/* Tab Nav */}
        <div className="flex border-b border-slate-800 px-5 pt-2 bg-[#091122]">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Bancos Conectados ({banks.length})
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'connect'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Conectar Novo Banco</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Frequência de Auto-Sync
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Protocolo de segurança TLS 1.3 / Certificação Banco Central do Brasil</span>
                </div>
                <button
                  onClick={onSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo'}</span>
                </button>
              </div>

              <div className="space-y-2">
                {banks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BankLogo slug={b.slug} size={32} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 uppercase">
                          {b.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Ag. {b.agency} • Conta {b.accountNumber} • Atualizado: {b.lastSync}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.balance)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ativo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT NEW BANK */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              {connectingStep === 0 && (
                <>
                  <p className="text-xs text-slate-300">
                    Selecione a instituição financeira que deseja integrar via Open Finance para importar transações automaticamente:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableBanksToConnect.map((b) => (
                      <button
                        key={b.slug}
                        onClick={() => handleStartConnect(b.slug)}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <BankLogo slug={b.slug} size={32} />
                          <div>
                            <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                              {b.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {b.type}
                            </p>
                          </div>
                        </div>
                        <Link2 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {connectingStep === 1 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <h3 className="text-sm font-bold text-white">
                    Autenticando via Open Finance...
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Estabelecendo conexão segura com os servidores bancários e solicitando permissão de leitura de extratos.
                  </p>
                </div>
              )}

              {connectingStep === 2 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                  <h3 className="text-sm font-bold text-emerald-300">
                    Conta integrada com sucesso!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Saldos e extratos foram importados e sincronizados com seu painel.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Frequência de Sincronização em Segundo Plano:
                </label>
                <div className="space-y-2">
                  {[
                    { id: '15m', label: 'A cada 15 minutos (Recomendado)', desc: 'Ideal para conciliação em tempo real de PIX e compras' },
                    { id: '1h', label: 'A cada 1 hora', desc: 'Sincroniza a cada 60 minutos automaticamente' },
                    { id: 'daily', label: 'Diário às 06:00', desc: 'Importa consolidado do dia anterior nas primeiras horas' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        syncInterval === opt.id
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sync-interval"
                        checked={syncInterval === opt.id}
                        onChange={() => setSyncInterval(opt.id)}
                        className="mt-0.5 text-cyan-500 focus:ring-cyan-400"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{opt.label}</p>
                        <p className="text-[11px] text-slate-400">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  As notificações de transações e atualização de saldo refletem instantaneamente no seu Resumo Financeiro e nos gráficos de Evolução e Categorias.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080e1c] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Open Banking API v3 • Criptografia ponta a ponta
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
