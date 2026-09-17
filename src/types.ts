export type BankSlug = 
  | 'c6'
  | 'bradesco'
  | 'itau'
  | 'santander-pf'
  | 'santander-pj'
  | 'mercado-pago'
  | 'nubank'
  | 'inter'
  | 'bb';

export interface BankAccount {
  id: string;
  name: string;
  slug: BankSlug;
  balance: number;
  availableBalance: number;
  accountType: 'corrente' | 'poupanca' | 'pj' | 'pagamento';
  accountNumber: string;
  agency: string;
  color: string;
  glowColor: 'cyan' | 'red' | 'orange' | 'blue' | 'purple' | 'green';
  lastSync: string;
  status: 'connected' | 'syncing' | 'error';
  autoSync: boolean;
}

export type TransactionType = 'income' | 'expense';

export type CategoryKey = string;

export interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryKey: CategoryKey;
  date: string;
  rawDate: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  bankId: string;
  bankName: string;
  bankSlug: BankSlug;
  tags?: string[];
  isRecurring?: boolean;
  recurrencePeriod?: 'monthly' | 'weekly' | 'yearly';
  isInvoice?: boolean; // Fatura de cartão de crédito
  dueDate?: string; // Data de vencimento (YYYY-MM-DD)
  status?: 'pending' | 'paid' | 'overdue';
  barcode?: string;
  cardLastDigits?: string;
  fixedExpenseId?: string;
  isFixedExpense?: boolean;
}

export interface FixedExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDay: number; // Day of month 1..31
  frequency: 'monthly' | 'yearly' | 'weekly';
  status: 'pending' | 'paid' | 'overdue';
  bankSlug?: BankSlug;
  bankName?: string;
  barcode?: string;
  autoDebit?: boolean;
}

export interface CategoryExpense {
  id: string;
  key: CategoryKey;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  bgRgba: string;
}

export interface FinancialEvolutionPoint {
  date: string; // '01 Mai', '08 Mai', etc.
  fullDate: string; // '01/05/2025'
  receitas: number;
  despesas: number;
  saldo: number;
  saldoAnterior?: number;
  receitasAnterior?: number;
  despesasAnterior?: number;
  previousDateLabel?: string;
}

export interface FinancialSummary {
  saldoTotal: number;
  receitas: number;
  despesas: number;
  contasConectadas: number;
  periodLabel: string;
  saldoProjetado?: number;
  despesasPendentes?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'fin';
  text: string;
  timestamp: string;
  metricsHighlight?: {
    label: string;
    value: string;
  }[];
}

export type AvatarId = 'roberto' | 'elfo' | 'rainha' | 'wandinha' | 'astronauta' | 'gato';

export interface UserProfile {
  id: string;
  name: string;
  avatarId: AvatarId;
  colorName?: string;
  roleDescription?: string;
  createdDate?: string;
  pin?: string; // Senha ou PIN de 4 dígitos para acesso seguro
  billReminderEnabled?: boolean; // Ativação de lembretes de vencimento de faturas
  billReminderDaysBefore?: 1 | 3 | 7; // Dias de antecedência (1, 3 ou 7)
}
