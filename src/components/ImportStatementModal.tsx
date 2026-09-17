import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building2,
  Filter,
  Trash2,
  FileCode,
  Loader2,
} from 'lucide-react';
import { BankAccount, CategoryKey, Transaction } from '../types';
import { BankLogo } from './BankLogos';
import { usePrivacy } from '../contexts/PrivacyContext';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: BankAccount[];
  onImportTransactions: (txs: Omit<Transaction, 'id'>[]) => void;
}

interface ParsedStatementItem {
  id: string;
  selected: boolean;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryKey: CategoryKey;
  date: string;
  rawDate: string;
}
export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  isOpen,
  onClose,
  banks,
  onImportTransactions,
}) => {
  const { formatValue } = usePrivacy();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || 'bank-itau');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedStatementItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const guessCategory = (memo: string, isIncome: boolean): { category: string; categoryKey: CategoryKey } => {
    if (isIncome) return { category: 'Receita / Salário', categoryKey: 'receita' };
    const text = memo.toLowerCase();
    if (/mercado|pao de acucar|supermercado|ifood|padaria|restaurante|burger|pizza|comida|almoço|lanche/i.test(text)) {
      return { category: 'Alimentação', categoryKey: 'alimentacao' };
    }
    if (/uber|99|gasolina|combustivel|posto|auto|posto|estacionamento|metrô|pedagio/i.test(text)) {
      return { category: 'Transporte', categoryKey: 'transporte' };
    }
    if (/netflix|spotify|cinema|steam|playstation|jogo|lazer|ingressos/i.test(text)) {
      return { category: 'Lazer', categoryKey: 'lazer' };
    }
    if (/drogaria|farmacia|farmácia|saude|medico|laboratorio|unimed/i.test(text)) {
      return { category: 'Saúde', categoryKey: 'saude' };
    }
    if (/aluguel|condominio|condomínio|enel|sabesp|energia|luz|agua|vivo|claro|internet/i.test(text)) {
      return { category: 'Moradia', categoryKey: 'moradia' };
    }
    return { category: 'Outros', categoryKey: 'outros' };
  };

  const parseOFX = (text: string): ParsedStatementItem[] => {
    const transactions: ParsedStatementItem[] = [];
    const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    let index = 0;
    while ((match = stmttrnRegex.exec(text)) !== null) {
      index++;
      const block = match[1];

      // Extract Memo or Name
      const memoMatch = block.match(/<MEMO>([^\r\n<]+)/i) || block.match(/<NAME>([^\r\n<]+)/i);
      const rawMemo = memoMatch ? memoMatch[1].trim() : `Transação Extrato ${index}`;

      // Extract Amount
      const amtMatch = block.match(/<TRNAMT>([^\r\n<]+)/i);
      const amtVal = amtMatch ? parseFloat(amtMatch[1].trim()) : 0;

      // Extract Date (format YYYYMMDD...)
      const dateMatch = block.match(/<DTPOSTED>(\d{4})(\d{2})(\d{2})/i);
      let dateStr = '09/09/2026';
      let rawDateStr = '2026-09-09';
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2];
        const day = dateMatch[3];
        dateStr = `${day}/${month}/${year}`;
        rawDateStr = `${year}-${month}-${day}`;
      }

      const isIncome = amtVal > 0;
      const absAmount = Math.abs(amtVal);
      const { category, categoryKey } = guessCategory(rawMemo, isIncome);

      transactions.push({
        id: `stmt-${Date.now()}-${index}`,
        selected: true,
        title: rawMemo,
        amount: absAmount,
        type: isIncome ? 'income' : 'expense',
        category,
        categoryKey,
        date: dateStr,
        rawDate: rawDateStr,
      });
    }

    return transactions;
  };

  const parseCSV = (text: string): ParsedStatementItem[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const transactions: ParsedStatementItem[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Delimiter could be ; or ,
      const sep = line.includes(';') ? ';' : ',';
      const cols = line.split(sep).map((c) => c.replace(/["']/g, '').trim());
      if (cols.length >= 3) {
        const rawDate = cols[0];
        const rawTitle = cols[1];
        const rawAmountStr = cols[2].replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
        const numAmount = parseFloat(rawAmountStr);

        if (!isNaN(numAmount) && rawTitle) {
          const isIncome = numAmount > 0;
          const absAmount = Math.abs(numAmount);
          const { category, categoryKey } = guessCategory(rawTitle, isIncome);

          transactions.push({
            id: `csv-${Date.now()}-${i}`,
            selected: true,
            title: rawTitle,
            amount: absAmount,
            type: isIncome ? 'income' : 'expense',
            category,
            categoryKey,
            date: rawDate.includes('-')
              ? rawDate.split('-').reverse().join('/')
              : rawDate,
            rawDate: rawDate.includes('/')
              ? rawDate.split('/').reverse().join('-')
              : rawDate,
          });
        }
      }
    }
    return transactions;
  };

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    setErrorMessage(null);
    setAiSummary(null);

    // If PDF file, call the server AI parser
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setIsProcessingPdf(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const response = await fetch('/api/parse-statement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data,
              mimeType: file.type || 'application/pdf',
              fileName: file.name,
            }),
          });

          const data = await response.json();
          if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            const items: ParsedStatementItem[] = data.transactions.map((tx: any, idx: number) => ({
              id: tx.id || `pdf-tx-${Date.now()}-${idx}`,
              selected: true,
              title: tx.title || 'Transação Extrato',
              amount: typeof tx.amount === 'number' ? Math.abs(tx.amount) : 0,
              type: tx.type === 'income' ? 'income' : 'expense',
              category: tx.category || 'Outros',
              categoryKey: (tx.categoryKey as CategoryKey) || 'outros',
              date: tx.date || new Date().toLocaleDateString('pt-BR'),
              rawDate: tx.rawDate || new Date().toISOString().split('T')[0],
            }));

            setParsedItems(items);
            if (data.summary) {
              setAiSummary(data.summary);
            }
            if (data.bankSlug) {
              const matched = banks.find(
                (b) => b.slug === data.bankSlug || b.id.toLowerCase().includes(data.bankSlug.toLowerCase())
              );
              if (matched) {
                setSelectedBankId(matched.id);
              }
            }
          } else {
            setErrorMessage(data.error || 'Nenhuma transação detectada no PDF.');
          }
        } catch (err: any) {
          setErrorMessage('Erro ao comunicar com o analisador de extratos em PDF.');
        } finally {
          setIsProcessingPdf(false);
        }
      };
      reader.onerror = () => {
        setIsProcessingPdf(false);
        setErrorMessage('Falha ao ler o arquivo PDF.');
      };
      reader.readAsDataURL(file);
      return;
    }

    // OFX or CSV parsing
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setErrorMessage('Não foi possível ler o conteúdo do arquivo.');
        return;
      }

      let parsed: ParsedStatementItem[] = [];
      if (file.name.toLowerCase().endsWith('.ofx') || text.includes('<OFX>')) {
        parsed = parseOFX(text);
      } else {
        parsed = parseCSV(text);
      }

      if (parsed.length === 0) {
        setErrorMessage('Nenhuma transação válida detectada no arquivo. Verifique se o extrato é PDF, OFX ou CSV.');
      } else {
        setParsedItems(parsed);
      }
    };
    reader.readAsText(file);
  };

  const toggleSelectItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = parsedItems.every((item) => item.selected);
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const selectedCount = parsedItems.filter((item) => item.selected).length;
  const totalIncome = parsedItems
    .filter((i) => i.selected && i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = parsedItems
    .filter((i) => i.selected && i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const handleConfirmImport = () => {
    const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];
    const itemsToImport = parsedItems
      .filter((item) => item.selected)
      .map((item) => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        categoryKey: item.categoryKey,
        date: item.date,
        rawDate: item.rawDate,
        bankId: selectedBank.id,
        bankName: selectedBank.name,
        bankSlug: selectedBank.slug,
        tags: ['extrato-importado', fileName || 'extrato'],
      }));

    if (itemsToImport.length > 0) {
      onImportTransactions(itemsToImport);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0b1325] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Importar Extrato Bancário</span>
                <span className="text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  PDF • OFX • CSV
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Importe lançamentos a partir do extrato em PDF, OFX ou CSV emitido pelo seu banco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Destination Bank selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#080e1c] border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Destino dos Lançamentos:</span>
            </div>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="bg-[#0b1325] border border-slate-700/80 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: R$ {b.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Upload Area */}
          {parsedItems.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-[#080e1c]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ofx,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {isProcessingPdf ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Analisando Extrato PDF com Inteligência Artificial...
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Lendo transações, identificando valores e categorizando despesas automaticamente.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-inner">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shadow-inner">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">
                    Arraste seu extrato bancário em PDF, OFX ou CSV aqui
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
                    Suporta extratos bancários em PDF oficiais de bancos como Nubank, Itaú, C6 Bank, Bradesco, Santander e Inter.
                  </p>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Selecionar Arquivo (PDF / OFX / CSV)</span>
                    </button>
                  </div>
                </>
              )}

              {errorMessage && (
                <div className="mt-4 p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Transactions Preview */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {fileName?.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="w-4 h-4 text-red-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>{fileName}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({parsedItems.length} transações encontradas)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    {parsedItems.every((i) => i.selected) ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedItems([]);
                      setFileName(null);
                      setAiSummary(null);
                    }}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-2"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>

              {/* AI Summary Banner if present */}
              {aiSummary && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/50 via-cyan-950/40 to-slate-900/60 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Resumo do Extrato em PDF</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Summary Stats Banner */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#080e1c] border border-slate-800 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Selecionadas</span>
                  <span className="text-xs font-bold text-white">
                    {selectedCount} de {parsedItems.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Entradas</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    + {formatValue(totalIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Saídas</span>
                  <span className="text-xs font-bold text-red-400 font-mono">
                    - {formatValue(totalExpense)}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/60 bg-[#080e1c]">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectItem(item.id)}
                    className={`flex items-center justify-between p-2.5 transition-colors cursor-pointer text-xs ${
                      item.selected ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'opacity-60 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                      />
                      <div>
                        <h4 className="font-semibold text-slate-100">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{item.date}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold">
                      <span className={item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                        {item.type === 'income' ? `+ ${formatValue(item.amount)}` : `- ${formatValue(item.amount)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#080e1c]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Importar {selectedCount} Transações</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
