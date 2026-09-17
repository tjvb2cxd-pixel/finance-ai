import React, { useState } from 'react';
import { BankAccount } from '../types';
import { usePrivacy } from '../contexts/PrivacyContext';
import { BankLogo } from './BankLogos';
import { ConfirmDangerModal } from './ConfirmDangerModal';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { ArrowLeft, Plus, RefreshCw, CheckCircle2, Shield, ExternalLink, Unlink, Edit3 } from 'lucide-react';

interface AccountsViewProps {
  banks: BankAccount[];
  onBackToOverview: () => void;
  onConnectNewBank: () => void;
  onSyncBank: (bankId: string) => void;
  onRemoveBank?: (bankId: string) => void;
  onSaveBalance?: (bankId: string, newBalance: number) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  banks,
  onBackToOverview,
  onConnectNewBank,
  onSyncBank,
  onRemoveBank,
  onSaveBalance,
}) => {
  const { formatValue } = usePrivacy();
  const [bankToDisconnect, setBankToDisconnect] = useState<BankAccount | null>(null);
  const [bankToAdjust, setBankToAdjust] = useState<BankAccount | null>(null);

  const totalBalance = banks.reduce((sum, b) => sum + b.availableBalance, 0);
  const averageBalance = banks.length > 0 ? totalBalance / banks.length : 0;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 flex-1 flex flex-col justify-between min-h-[calc(100vh-230px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Contas Bancárias & Extratos</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Open Finance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie a integração e conciliação automática das suas contas e extratos bancários
            </p>
          </div>
        </div>

        <button
          onClick={onConnectNewBank}
          className="flex items-center gap-2 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.35)] transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white font-bold">Importar Extrato</span>
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0b1325]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Saldo Consolidado</span>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{formatValue(totalBalance)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Disponível em tempo real</p>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Contas Conectadas</span>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-white font-mono">{banks.length} instituições</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Itaú, Bradesco, Santander</p>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Média por Conta</span>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-200 font-mono">{formatValue(averageBalance)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Saldo médio ponderado</p>
          </div>
        </div>

        <div className="bg-[#0b1325]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Status da Conciliação</span>
          <div className="mt-2">
            <p className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>100% Sincronizado</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Criptografia Ponta a Ponta</p>
          </div>
        </div>
      </div>

      {/* Banks Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {banks.map((bank) => (
          <div
            key={bank.id}
            className="bg-[#0b1325]/90 border border-slate-800/80 hover:border-cyan-500/40 p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BankLogo slug={bank.slug} size={42} className="w-10 h-10 rounded-xl" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">{bank.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Agência: {bank.agency} • Conta: {bank.accountNumber}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativa
                </span>
              </div>

              <div className="my-4 p-3.5 sm:p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Saldo em Conta</span>
                  <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono tracking-tight">
                    {formatValue(bank.availableBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Última Leitura</span>
                  <span className="text-xs font-mono text-slate-300">{bank.lastSync}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Válido por 365 dias</span>
              </span>
              <div className="flex items-center gap-2">
                {onRemoveBank && (
                  <button
                    onClick={() => setBankToDisconnect(bank)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-500/20 font-medium transition-colors text-xs"
                    title="Desconectar conta bancária"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </button>
                )}
                {onSaveBalance && (
                  <button
                    onClick={() => setBankToAdjust(bank)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 font-medium transition-colors text-xs"
                    title="Ajustar saldo da conta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ajustar</span>
                  </button>
                )}
                <button
                  onClick={() => onSyncBank(bank.id)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 hover:bg-cyan-950/60 transition-colors text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Open Finance Regulatory & Security Ribbon */}
      <div className="bg-[#0b1325]/70 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            Conexão regulada pela Resolução Conjunta nº 1 do <strong>Banco Central do Brasil</strong>. Seus dados são auditados e protegidos com criptografia AES-256.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          TLS 1.3 • Certificado ICP-Brasil
        </span>
      </div>

      {/* Modal de Ajuste de Saldo */}
      <AdjustBalanceModal
        isOpen={Boolean(bankToAdjust)}
        onClose={() => setBankToAdjust(null)}
        bank={bankToAdjust}
        onSaveBalance={(bankId, newBalance) => {
          onSaveBalance?.(bankId, newBalance);
          setBankToAdjust(null);
        }}
      />

      {/* Modal de Atenção / Confirmação de Desconexão de Conta Bancária */}
      <ConfirmDangerModal
        isOpen={Boolean(bankToDisconnect)}
        onClose={() => setBankToDisconnect(null)}
        onConfirm={() => {
          if (bankToDisconnect) {
            onRemoveBank?.(bankToDisconnect.id);
            setBankToDisconnect(null);
          }
        }}
        title="Desconectar Conta Bancária"
        badgeText="Atenção: Remoção Open Finance"
        description={`Você tem certeza que deseja desconectar e remover a conta do ${bankToDisconnect?.name}?`}
        itemPreview={
          bankToDisconnect
            ? {
                icon: (
                  <BankLogo
                    slug={bankToDisconnect.slug}
                    size={36}
                    className="w-9 h-9 rounded-lg flex-shrink-0"
                  />
                ),
                title: bankToDisconnect.name,
                subtitle: `Agência ${bankToDisconnect.agency} • Conta ${bankToDisconnect.accountNumber} • Saldo: ${formatValue(bankToDisconnect.availableBalance)}`,
                tag: 'Open Finance',
                tagColor: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30',
              }
            : undefined
        }
        impactPoints={[
          'O saldo desta conta deixará de compor o saldo total consolidado do painel.',
          'A sincronização automática diária desta instituição financeira será cancelada.',
          'O histórico de transações passadas importadas continuará arquivado.',
        ]}
        confirmButtonText="Sim, Desconectar Conta"
        cancelButtonText="Cancelar e Manter Conta"
        variant="danger"
        actionType="disconnect"
      />
    </div>
  );
};
