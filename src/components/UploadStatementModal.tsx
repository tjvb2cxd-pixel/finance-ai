import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Bot, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit2, 
  Plus, 
  Check, 
  Building2, 
  Layers, 
  Calendar 
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface UploadStatementModalProps {
  droppedFile?: File | null;
  isOpen: boolean;
  onClose: () => void;
  onTransactionsParsed: (transactions: Transaction[], bankSlug?: string, finalBalance?: number) => void;
}

const CATEGORY_OPTIONS = [
  { key: 'alimentacao', label: 'Alimentação' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'moradia', label: 'Moradia' },
  { key: 'saude', label: 'Saúde' },
  { key: 'lazer', label: 'Lazer' },
  { key: 'receita', label: 'Receita / Salário' },
  { key: 'outros', label: 'Outros' },
];

export const UploadStatementModal: React.FC<UploadStatementModalProps> = ({
  isOpen,
  onClose,
  onTransactionsParsed,
  droppedFile,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [pendingBankInfo, setPendingBankInfo] = useState<{ slug: string; balance: number; name?: string } | null>(null);
  const [step, setStep] = useState<'upload' | 'review' | 'confirmed'>('upload');
  
  // Selection and inline editing state
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Partial<Transaction>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && droppedFile && !isUploading && step === 'upload' && !error) {
      processFile(droppedFile);
    }
  }, [isOpen, droppedFile]);

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSummary(null);
      setPendingTxs([]);
      setPendingBankInfo(null);
      setStep('upload');
      setSelectedTxIds(new Set());
      setEditingTxId(null);
    }
  }, [isOpen]);

  const handleParseSuccess = (
    transactions: Transaction[],
    bankSlug?: string,
    finalBalance?: number | null,
    bankName?: string,
    docSummary?: string
  ) => {
    const formatted = transactions.map((tx, idx) => ({
      ...tx,
      id: tx.id || `pdf-tx-${Date.now()}-${idx}`,
      bankSlug: (tx.bankSlug || bankSlug || 'inter') as any,
      bankName: tx.bankName || bankName || 'Banco Inter',
    }));

    setPendingTxs(formatted);
    setSelectedTxIds(new Set(formatted.map(t => t.id)));
    setSummary(docSummary || null);

    if (bankSlug) {
      setPendingBankInfo({
        slug: bankSlug,
        balance: finalBalance !== null && finalBalance !== undefined ? finalBalance : 0,
        name: bankName || (bankSlug === 'inter' ? 'Banco Inter' : bankSlug.toUpperCase()),
      });
    }

    setStep('review');
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor, envie apenas arquivos PDF.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSummary(null);

    try {
      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo localmente.'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type,
          fileName: file.name,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
        handleParseSuccess(
          data.transactions,
          data.bankSlug,
          data.finalBalance,
          data.bankName,
          data.summary
        );
      } else {
        setError(data.error || 'Nenhuma transação financeira foi encontrada no documento.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTxIds.size === pendingTxs.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(pendingTxs.map(t => t.id)));
    }
  };

  const handleDeleteTx = (id: string) => {
    setPendingTxs(prev => prev.filter(t => t.id !== id));
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const startEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditingField({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      categoryKey: tx.categoryKey,
      category: tx.category,
      date: tx.date,
    });
  };

  const saveEditTx = (id: string) => {
    setPendingTxs(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const matchingCat = CATEGORY_OPTIONS.find(c => c.key === editingField.categoryKey);
        return {
          ...t,
          ...editingField,
          category: matchingCat ? matchingCat.label : (editingField.category || t.category),
          amount: Number(editingField.amount) || t.amount,
        };
      })
    );
    setEditingTxId(null);
    setEditingField({});
  };

  const cancelEditTx = () => {
    setEditingTxId(null);
    setEditingField({});
  };

  const handleConfirmImport = () => {
    const txsToImport = pendingTxs.filter(t => selectedTxIds.has(t.id));
    if (txsToImport.length === 0) {
      setError('Selecione pelo menos uma transação para importar.');
      return;
    }

    onTransactionsParsed(txsToImport, pendingBankInfo?.slug, pendingBankInfo?.balance);
    setStep('confirmed');
  };

  const handleCloseAndFinish = () => {
    onClose();
  };

  if (!isOpen) return null;

  const totalIncomeSelected = pendingTxs
    .filter(t => selectedTxIds.has(t.id) && t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenseSelected = pendingTxs
    .filter(t => selectedTxIds.has(t.id) && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div 
      id="upload-statement-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a14]/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div 
        id="upload-statement-dialog"
        className={`bg-[#0b1325] border border-slate-800 rounded-3xl w-full shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
          step === 'review' ? 'max-w-3xl max-h-[90vh]' : 'max-w-lg'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#080e1c] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  {step === 'upload' && 'Importar Extrato PDF'}
                  {step === 'review' && 'Revisão Pré-Importação'}
                  {step === 'confirmed' && 'Importação Concluída'}
                </h2>
                {step === 'review' && pendingBankInfo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {pendingBankInfo.name || pendingBankInfo.slug.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {step === 'upload' && 'Extraia transações automaticamente com inteligência artificial'}
                {step === 'review' && 'Verifique, ajuste ou desmarque as transações antes de salvar no painel'}
                {step === 'confirmed' && 'Dados consolidados com sucesso no seu dashboard e nuvem'}
              </p>
            </div>
          </div>
          <button
            id="close-upload-statement-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div 
              id="upload-dropzone"
              className="border-2 border-dashed border-slate-700/60 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-slate-800/40"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input 
                id="statement-pdf-input"
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf"
                className="hidden" 
                disabled={isUploading}
              />
              
              {isUploading ? (
                <>
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                  <p className="text-sm font-bold text-white mb-1">Processando extrato bancário...</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Lendo o documento com precisão e extraindo cada transação real.
                  </p>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-slate-500 mb-3" />
                  <p className="text-sm font-bold text-slate-200 mb-1">Selecione ou arraste seu Extrato em PDF</p>
                  <p className="text-xs text-slate-400">Banco Inter, Itaú, Bradesco, Santander, Nubank</p>
                  <button 
                    id="choose-statement-file-btn"
                    className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors pointer-events-none"
                  >
                    Procurar arquivo PDF
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2: REVIEW (PRE-IMPORT REVISION) */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Summary and Stats bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">Selecionadas</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-white">{selectedTxIds.size}</span>
                    <span className="text-xs text-slate-500">de {pendingTxs.length} transações</span>
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block mb-1">Total Entradas</span>
                  <span className="text-base font-bold text-emerald-400">
                    + R$ {totalIncomeSelected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                  <span className="text-[10px] uppercase tracking-wider text-red-400/80 block mb-1">Total Saídas</span>
                  <span className="text-base font-bold text-red-400">
                    - R$ {totalExpenseSelected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* AI Summary note if available */}
              {summary && (
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 text-left flex items-start gap-2.5">
                  <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Leitura do Extrato</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{summary}</p>
                  </div>
                </div>
              )}

              {/* Action bar above table */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    id="select-all-statement-txs-btn"
                    onClick={toggleSelectAll}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      selectedTxIds.size === pendingTxs.length && pendingTxs.length > 0
                        ? 'bg-cyan-500 border-cyan-400 text-black' 
                        : 'border-slate-600 bg-slate-800'
                    }`}>
                      {selectedTxIds.size === pendingTxs.length && pendingTxs.length > 0 && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    {selectedTxIds.size === pendingTxs.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Clique no ícone de lápis para editar ou na lixeira para excluir
                </span>
              </div>

              {/* Transactions list */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60 bg-slate-900/30 max-h-[340px] overflow-y-auto">
                {pendingTxs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Todas as transações foram removidas.
                  </div>
                ) : (
                  pendingTxs.map((tx) => {
                    const isSelected = selectedTxIds.has(tx.id);
                    const isEditing = editingTxId === tx.id;

                    if (isEditing) {
                      return (
                        <div key={tx.id} className="p-3 bg-slate-800/80 space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Descrição</label>
                              <input
                                type="text"
                                value={editingField.title ?? tx.title}
                                onChange={e => setEditingField(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Valor (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingField.amount ?? tx.amount}
                                  onChange={e => setEditingField(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Tipo</label>
                                <select
                                  value={editingField.type ?? tx.type}
                                  onChange={e => setEditingField(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="expense">Despesa (-)</option>
                                  <option value="income">Receita (+)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Categoria</label>
                              <select
                                value={editingField.categoryKey ?? tx.categoryKey}
                                onChange={e => setEditingField(prev => ({ ...prev, categoryKey: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                              >
                                {CATEGORY_OPTIONS.map(c => (
                                  <option key={c.key} value={c.key}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Data</label>
                              <input
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={editingField.date ?? tx.date}
                                onChange={e => setEditingField(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={cancelEditTx}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditTx(tx.id)}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={tx.id}
                        className={`p-3 flex items-center gap-3 transition-colors ${
                          isSelected ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'opacity-50 bg-transparent hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSelectTx(tx.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected 
                              ? 'bg-cyan-500 border-cyan-400 text-black' 
                              : 'border-slate-600 bg-slate-800/80 hover:border-slate-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        {/* Type Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-100 truncate">{tx.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tx.date}
                            </span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                              {tx.category}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xs font-bold ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 pl-1">
                          <button
                            type="button"
                            onClick={() => startEditTx(tx)}
                            title="Editar transação"
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700/60 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTx(tx.id)}
                            title="Excluir"
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Buttons footer */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition-all text-xs"
                >
                  Substituir Arquivo
                </button>
                <button
                  id="confirm-statement-import-btn"
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedTxIds.size === 0}
                  className="w-2/3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)] text-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirmar e Salvar ({selectedTxIds.size}) Lançamentos
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRMED */}
          {step === 'confirmed' && (
            <div className="space-y-4 py-2">
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-emerald-400">Importação Concluída com Sucesso!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {selectedTxIds.size} transações foram salvas permanentemente no seu dashboard e na nuvem.
                  {pendingBankInfo && (
                    <span className="block mt-1 text-slate-400">
                      Conta vinculada: <strong>{pendingBankInfo.name || pendingBankInfo.slug.toUpperCase()}</strong>
                    </span>
                  )}
                </p>
              </div>

              <button
                id="finish-statement-modal-btn"
                onClick={handleCloseAndFinish}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(var(--theme-glow-rgb),0.4)] text-xs"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <span>🔒 Análise segura. Suas informações são sincronizadas em tempo real com seu banco de dados.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
