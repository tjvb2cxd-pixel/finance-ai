import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const cfg = firebaseConfig as any;
const db = cfg.firestoreDatabaseId
  ? getFirestore(app, cfg.firestoreDatabaseId)
  : getFirestore(app);

async function zeroData() {
  console.log('Starting Firestore zero-out process...');

  // 1. Delete all transactions
  try {
    const txSnap = await getDocs(collection(db, 'transactions'));
    console.log(`Found ${txSnap.size} transactions to remove`);
    if (!txSnap.empty) {
      const batch = writeBatch(db);
      txSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log('Deleted all transactions from Firestore');
    }
  } catch (err) {
    console.error('Error deleting transactions:', err);
  }

  // 2. Delete all fixed_expenses
  try {
    const feSnap = await getDocs(collection(db, 'fixed_expenses'));
    console.log(`Found ${feSnap.size} fixed expenses to remove`);
    if (!feSnap.empty) {
      const batch = writeBatch(db);
      feSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log('Deleted all fixed expenses from Firestore');
    }
  } catch (err) {
    console.error('Error deleting fixed expenses:', err);
  }

  // 3. Ensure ONLY the 3 desired banks exist with 0.0 balance, and delete removed banks
  try {
    const banksSnap = await getDocs(collection(db, 'banks'));
    const keepIds = ['bank-itau', 'bank-bradesco', 'bank-santander-pf'];
    const deleteBatch = writeBatch(db);
    let toDeleteCount = 0;
    banksSnap.forEach((d) => {
      if (!keepIds.includes(d.id)) {
        deleteBatch.delete(d.ref);
        toDeleteCount++;
      }
    });
    if (toDeleteCount > 0) {
      await deleteBatch.commit();
      console.log(`Deleted ${toDeleteCount} obsolete bank documents`);
    }

    const initialBanks = [
      {
        id: 'bank-itau',
        name: 'ITAÚ',
        slug: 'itau',
        balance: 0.0,
        availableBalance: 0.0,
        accountType: 'corrente',
        accountNumber: '48201-9',
        agency: '0342',
        color: '#ec7000',
        glowColor: 'orange',
        lastSync: 'Aguardando lançamentos',
        status: 'connected',
        autoSync: true,
      },
      {
        id: 'bank-bradesco',
        name: 'BRADESCO',
        slug: 'bradesco',
        balance: 0.0,
        availableBalance: 0.0,
        accountType: 'corrente',
        accountNumber: '12940-5',
        agency: '1432',
        color: '#cc092f',
        glowColor: 'red',
        lastSync: 'Aguardando lançamentos',
        status: 'connected',
        autoSync: true,
      },
      {
        id: 'bank-santander-pf',
        name: 'SANTANDER PF',
        slug: 'santander-pf',
        balance: 0.0,
        availableBalance: 0.0,
        accountType: 'corrente',
        accountNumber: '99201-0',
        agency: '2105',
        color: '#ec0000',
        glowColor: 'red',
        lastSync: 'Aguardando lançamentos',
        status: 'connected',
        autoSync: true,
      },
    ];
    const batch = writeBatch(db);
    initialBanks.forEach((b) => {
      batch.set(doc(db, 'banks', b.id), b);
    });
    await batch.commit();
    console.log('Successfully set 3 banks (Itaú, Bradesco, Santander PF) to 0.0 balance in Firestore');
  } catch (err) {
    console.error('Error setting banks to 0:', err);
  }

  console.log('Zero-out complete!');
  process.exit(0);
}

zeroData();
