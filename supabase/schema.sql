-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS FINANCE AI PARA SUPABASE (POSTGRESQL)
-- Execute este script no SQL Editor do seu projeto no Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Habilitar extensões úteis
create extension if not exists "uuid-ossp";

-- 2. Tabela: Contas Bancárias (bank_accounts)
create table if not exists public.bank_accounts (
  id text primary key,
  name text not null,
  slug text not null,
  balance numeric(15, 2) not null default 0.00,
  available_balance numeric(15, 2) not null default 0.00,
  account_type text not null default 'corrente',
  account_number text not null default '',
  agency text not null default '',
  color text not null default '#06b6d4',
  glow_color text not null default 'cyan',
  last_sync text not null default 'Agora mesmo',
  status text not null default 'connected',
  auto_sync boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela: Transações (transactions)
create table if not exists public.transactions (
  id text primary key,
  title text not null,
  category text not null,
  category_key text not null default 'outros',
  date text not null,
  raw_date date not null default current_date,
  amount numeric(15, 2) not null default 0.00,
  type text not null check (type in ('income', 'expense')),
  bank_id text references public.bank_accounts(id) on delete set null,
  bank_name text not null,
  bank_slug text not null,
  tags text[] default '{}',
  is_recurring boolean default false,
  recurrence_period text,
  is_invoice boolean default false,
  due_date date,
  status text default 'paid',
  barcode text,
  card_last_digits text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela: Despesas Fixas e Recorrentes (fixed_expenses)
create table if not exists public.fixed_expenses (
  id text primary key,
  title text not null,
  category text not null,
  amount numeric(15, 2) not null default 0.00,
  due_day integer not null check (due_day between 1 and 31),
  frequency text not null default 'monthly',
  status text not null default 'pending',
  bank_slug text,
  bank_name text,
  barcode text,
  auto_debit boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Índices para performance
create index if not exists idx_transactions_bank_slug on public.transactions(bank_slug);
create index if not exists idx_transactions_raw_date on public.transactions(raw_date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_fixed_expenses_due_day on public.fixed_expenses(due_day);

-- 6. Políticas de Segurança (Row Level Security - RLS)
alter table public.bank_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_expenses enable row level security;

-- Políticas de Acesso Público para Desenvolvimento / Demo (ou vincule com auth.uid() se usar Supabase Auth)
create policy "Acesso leitura e escrita para anon" on public.bank_accounts
  for all using (true) with check (true);

create policy "Acesso leitura e escrita para anon" on public.transactions
  for all using (true) with check (true);

create policy "Acesso leitura e escrita para anon" on public.fixed_expenses
  for all using (true) with check (true);
