import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { BankAccount, Transaction, UserProfile, FixedExpenseItem } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
const cfg = firebaseConfig as any;
export const db: Firestore = cfg.firestoreDatabaseId
  ? getFirestore(app, cfg.firestoreDatabaseId)
  : getFirestore(app);

// Helper function to recursively remove undefined fields so Firestore writes never fail
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return data;
}

// Local Storage Fallback Keys
const LOCAL_TX_KEY = 'fin_cloud_transactions';
const LOCAL_BANKS_KEY = 'fin_cloud_banks';
const LOCAL_PROFILES_KEY = 'fin_cloud_profiles';

// ================= TRANSACTION CLOUD OPERATIONS ================= //

export async function fetchCloudTransactions(): Promise<Transaction[] | null> {
  try {
    const txCol = collection(db, 'transactions');
    const snapshot = await getDocs(txCol);
    if (!snapshot.empty) {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Transaction;
        list.push({ ...data, id: d.id });
      });
      // Save local backup
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(list));
      return list;
    } else {
      // Cloud has 0 transactions - check if local cache has transactions to preserve and sync to cloud
      const local = localStorage.getItem(LOCAL_TX_KEY);
      if (local) {
        try {
          const list: Transaction[] = JSON.parse(local);
          if (Array.isArray(list) && list.length > 0) {
            saveCloudTransactionsBatch(list).catch((e) =>
              console.warn('Sync local transactions to cloud:', e)
            );
            return list;
          }
        } catch {
          // ignore
        }
      }
      return [];
    }
  } catch (err) {
    console.warn('Firestore fetchCloudTransactions fallback to local cache:', err);
  }

  // Fallback to localStorage ONLY if offline or query failed
  const local = localStorage.getItem(LOCAL_TX_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return [];
}

export async function saveCloudTransaction(tx: Transaction): Promise<void> {
  // Update local cache immediately
  try {
    const local = localStorage.getItem(LOCAL_TX_KEY);
    const list: Transaction[] = local ? JSON.parse(local) : [];
    const index = list.findIndex((item) => item.id === tx.id);
    if (index >= 0) {
      list[index] = tx;
    } else {
      list.unshift(tx);
    }
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update local cache:', e);
  }

  // Update Firestore
  try {
    const ref = doc(db, 'transactions', tx.id);
    await setDoc(ref, sanitizeForFirestore(tx), { merge: true });
  } catch (err) {
    console.warn('Firestore saveCloudTransaction error:', err);
  }
}

export async function saveCloudTransactionsBatch(txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;

  // Local backup
  try {
    const local = localStorage.getItem(LOCAL_TX_KEY);
    const list: Transaction[] = local ? JSON.parse(local) : [];
    const map = new Map<string, Transaction>();
    list.forEach((t) => map.set(t.id, t));
    txs.forEach((t) => map.set(t.id, t));
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(Array.from(map.values())));
  } catch (e) {
    console.error('Failed to update local cache batch:', e);
  }

  // Firestore batch write (up to 500 per batch)
  try {
    const batch = writeBatch(db);
    txs.slice(0, 450).forEach((tx) => {
      const ref = doc(db, 'transactions', tx.id);
      batch.set(ref, sanitizeForFirestore(tx), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore saveCloudTransactionsBatch error:', err);
  }
}

export async function deleteCloudTransaction(id: string): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_TX_KEY);
    if (local) {
      const list: Transaction[] = JSON.parse(local);
      const filtered = list.filter((t) => t.id !== id);
      localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to remove from local cache:', e);
  }

  try {
    const ref = doc(db, 'transactions', id);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteCloudTransaction error:', err);
  }
}

// ================= BANK CLOUD OPERATIONS ================= //

export async function fetchCloudBanks(): Promise<BankAccount[] | null> {
  try {
    const col = collection(db, 'banks');
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      const list: BankAccount[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as BankAccount;
        list.push({ ...data, id: d.id });
      });
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetchCloudBanks fallback to local:', err);
  }

  const local = localStorage.getItem(LOCAL_BANKS_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveCloudBank(bank: BankAccount): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_BANKS_KEY);
    const list: BankAccount[] = local ? JSON.parse(local) : [];
    const index = list.findIndex((item) => item.id === bank.id);
    if (index >= 0) {
      list[index] = bank;
    } else {
      list.push(bank);
    }
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update local bank cache:', e);
  }

  try {
    const ref = doc(db, 'banks', bank.id);
    await setDoc(ref, sanitizeForFirestore(bank), { merge: true });
  } catch (err) {
    console.warn('Firestore saveCloudBank error:', err);
  }
}

export async function saveCloudBankBalance(bankId: string, newBalance: number): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_BANKS_KEY);
    const list: BankAccount[] = local ? JSON.parse(local) : [];
    const index = list.findIndex((item) => item.id === bankId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        balance: newBalance,
        availableBalance: newBalance,
        lastSync: 'Agora',
      };
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to update local bank cache:', e);
  }

  try {
    const ref = doc(db, 'banks', bankId);
    await setDoc(ref, {
      balance: newBalance,
      availableBalance: newBalance,
      lastSync: 'Agora',
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveCloudBankBalance error:', err);
  }
}

export async function saveCloudBanksBatch(banks: BankAccount[]): Promise<void> {
  if (banks.length === 0) return;

  try {
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(banks));
  } catch (e) {
    console.error('Failed to update local banks cache batch:', e);
  }

  try {
    const batch = writeBatch(db);
    banks.forEach((bank) => {
      const ref = doc(db, 'banks', bank.id);
      batch.set(ref, sanitizeForFirestore(bank), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore saveCloudBanksBatch error:', err);
  }
}

export async function deleteCloudBank(id: string): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_BANKS_KEY);
    if (local) {
      const list: BankAccount[] = JSON.parse(local);
      const filtered = list.filter((b) => b.id !== id);
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to remove bank from local cache:', e);
  }

  try {
    const ref = doc(db, 'banks', id);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteCloudBank error:', err);
  }
}

// ================= PROFILE CLOUD OPERATIONS ================= //

export async function fetchCloudProfiles(): Promise<UserProfile[] | null> {
  try {
    const col = collection(db, 'profiles');
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserProfile;
        list.push({ ...data, id: d.id });
      });
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetchCloudProfiles fallback:', err);
  }

  const local = localStorage.getItem(LOCAL_PROFILES_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveCloudProfile(profile: UserProfile): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_PROFILES_KEY);
    const list: UserProfile[] = local ? JSON.parse(local) : [];
    const index = list.findIndex((item) => item.id === profile.id);
    if (index >= 0) {
      list[index] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update local profile cache:', e);
  }

  try {
    const ref = doc(db, 'profiles', profile.id);
    await setDoc(ref, sanitizeForFirestore(profile), { merge: true });
  } catch (err) {
    console.warn('Firestore saveCloudProfile error:', err);
  }
}

export async function deleteCloudProfile(id: string): Promise<void> {
  try {
    const local = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (local) {
      const list: UserProfile[] = JSON.parse(local);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to remove profile from local cache:', e);
  }

  try {
    const ref = doc(db, 'profiles', id);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteCloudProfile error:', err);
  }
}

// Realtime cloud subscriptions
export function subscribeCloudTransactions(callback: (txs: Transaction[]) => void) {
  try {
    const col = collection(db, 'transactions');
    return onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as Transaction), id: d.id });
          });
          callback(list);
        }
      },
      (err) => {
        console.warn('Realtime cloud transactions error:', err);
      }
    );
  } catch (err) {
    console.warn('Could not establish transactions listener:', err);
    return () => {};
  }
}

export function subscribeCloudBanks(callback: (banks: BankAccount[]) => void) {
  try {
    const col = collection(db, 'banks');
    return onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: BankAccount[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as BankAccount), id: d.id });
          });
          callback(list);
        }
      },
      (err) => {
        console.warn('Realtime cloud banks error:', err);
      }
    );
  } catch (err) {
    console.warn('Could not establish banks listener:', err);
    return () => {};
  }
}

export function subscribeCloudFixedExpenses(callback: (items: FixedExpenseItem[]) => void) {
  try {
    const col = collection(db, 'fixed_expenses');
    return onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: FixedExpenseItem[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as FixedExpenseItem), id: d.id });
          });
          callback(list);
        }
      },
      (err) => {
        console.warn('Realtime cloud fixed expenses error:', err);
      }
    );
  } catch (err) {
    console.warn('Could not establish fixed expenses listener:', err);
    return () => {};
  }
}

// Reset cloud database to zero and set single profile
export async function resetCloudToZero(
  singleProfile: UserProfile,
  zeroedBanks: BankAccount[]
): Promise<void> {
  // 1. Wipe local cache
  try {
    localStorage.setItem(LOCAL_TX_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(zeroedBanks));
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify([singleProfile]));
    localStorage.setItem('finance_fixed_expenses_v2', JSON.stringify([]));
    localStorage.setItem('finance_alerts_bills_v2', JSON.stringify([]));
  } catch (e) {
    console.error('Failed to reset local cache:', e);
  }

  // 2. Clear all transactions in Firestore
  try {
    const txSnapshot = await getDocs(collection(db, 'transactions'));
    if (!txSnapshot.empty) {
      const batch = writeBatch(db);
      txSnapshot.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore reset transactions error:', err);
  }

  // 3. Reset profiles in Firestore to solely Tiago
  try {
    const profSnapshot = await getDocs(collection(db, 'profiles'));
    const batch = writeBatch(db);
    profSnapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    batch.set(doc(db, 'profiles', singleProfile.id), singleProfile);
    await batch.commit();
  } catch (err) {
    console.warn('Firestore reset profiles error:', err);
  }

  // 4. Reset banks in Firestore to zero balances
  try {
    const batch = writeBatch(db);
    zeroedBanks.forEach((b) => {
      batch.set(doc(db, 'banks', b.id), b, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore reset banks error:', err);
  }
}

// ================= FIXED EXPENSES CLOUD OPERATIONS ================= //

export const LOCAL_FIXED_KEY = 'finance_fixed_expenses_v2';

export async function fetchCloudFixedExpenses(): Promise<FixedExpenseItem[] | null> {
  try {
    const col = collection(db, 'fixed_expenses');
    const snapshot = await getDocs(col);
    if (!snapshot.empty) {
      const list: FixedExpenseItem[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as FixedExpenseItem), id: d.id });
      });
      try {
        localStorage.setItem(LOCAL_FIXED_KEY, JSON.stringify(list));
      } catch (e) {
        // ignore
      }
      return list;
    } else {
      // Cloud is currently empty. Check if local cache has fixed expenses to preserve and push to cloud
      const stored = localStorage.getItem(LOCAL_FIXED_KEY);
      if (stored) {
        try {
          const localList: FixedExpenseItem[] = JSON.parse(stored);
          if (Array.isArray(localList) && localList.length > 0) {
            saveCloudFixedExpensesBatch(localList).catch((err) =>
              console.warn('Syncing local fixed expenses to Firestore:', err)
            );
            return localList;
          }
        } catch {
          // ignore
        }
      }
      return [];
    }
  } catch (err) {
    console.warn('Firestore fetchCloudFixedExpenses error:', err);
  }

  // Fallback to local storage if query failed or offline
  try {
    const stored = localStorage.getItem(LOCAL_FIXED_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveCloudFixedExpense(item: FixedExpenseItem): Promise<void> {
  // Update local cache immediately
  try {
    const stored = localStorage.getItem(LOCAL_FIXED_KEY);
    const list: FixedExpenseItem[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(LOCAL_FIXED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update local cache for fixed expense:', e);
  }

  try {
    const docRef = doc(db, 'fixed_expenses', item.id);
    await setDoc(docRef, sanitizeForFirestore(item), { merge: true });
  } catch (err) {
    console.warn('Firestore saveCloudFixedExpense error:', err);
  }
}

export async function saveCloudFixedExpensesBatch(items: FixedExpenseItem[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_FIXED_KEY, JSON.stringify(items));
    if (items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, 'fixed_expenses', item.id);
      batch.set(docRef, sanitizeForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore saveCloudFixedExpensesBatch error:', err);
  }
}

export async function deleteCloudFixedExpense(id: string): Promise<void> {
  // Update local cache immediately
  try {
    const stored = localStorage.getItem(LOCAL_FIXED_KEY);
    if (stored) {
      const list: FixedExpenseItem[] = JSON.parse(stored);
      const filtered = list.filter((i) => i.id !== id);
      localStorage.setItem(LOCAL_FIXED_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to update local cache on fixed expense delete:', e);
  }

  try {
    const docRef = doc(db, 'fixed_expenses', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteCloudFixedExpense error:', err);
  }
}

// Zero-out all transactions, fixed expenses, and reset bank balances to 0.00
export async function clearAllCloudData(): Promise<void> {
  // 1. Wipe local caches
  try {
    localStorage.removeItem(LOCAL_TX_KEY);
    localStorage.removeItem(LOCAL_FIXED_KEY);
    localStorage.removeItem('finance_fixed_expenses_v2');
    const storedBanks = localStorage.getItem(LOCAL_BANKS_KEY);
    if (storedBanks) {
      const list: BankAccount[] = JSON.parse(storedBanks);
      const zeroed = list.map((b) => ({
        ...b,
        balance: 0.0,
        availableBalance: 0.0,
        lastSync: 'Aguardando lançamentos',
      }));
      localStorage.setItem(LOCAL_BANKS_KEY, JSON.stringify(zeroed));
    }
  } catch (e) {
    console.warn('Failed clearing local cache:', e);
  }

  // 2. Wipe Firestore transactions
  try {
    const txSnap = await getDocs(collection(db, 'transactions'));
    if (!txSnap.empty) {
      const batch = writeBatch(db);
      txSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Failed to wipe Firestore transactions:', err);
  }

  // 3. Wipe Firestore fixed_expenses
  try {
    const feSnap = await getDocs(collection(db, 'fixed_expenses'));
    if (!feSnap.empty) {
      const batch = writeBatch(db);
      feSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Failed to wipe Firestore fixed_expenses:', err);
  }

  // 4. Zero out all banks in Firestore
  try {
    const banksSnap = await getDocs(collection(db, 'banks'));
    if (!banksSnap.empty) {
      const batch = writeBatch(db);
      banksSnap.forEach((d) => {
        batch.update(d.ref, {
          balance: 0.0,
          availableBalance: 0.0,
          lastSync: 'Aguardando lançamentos',
        });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Failed to zero out Firestore banks:', err);
  }
}

