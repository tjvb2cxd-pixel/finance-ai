import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, sanitizeForFirestore } from './firebase';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Google Calendar Events Scope
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let isSigningIn = false;

// Persistent Storage Keys
const GCAL_ACCOUNT_KEY = 'finance_gcal_account_profile_v2';
const GCAL_TOKEN_KEY = 'finance_gcal_oauth_token_v2';
const GCAL_SYNCED_EVENTS_KEY = 'finance_ai_gcal_synced_map_v2';
const GCAL_SETTINGS_KEY = 'finance_gcal_settings_v2';

// In-memory token cache
let cachedAccessToken: string | null = null;

export interface GoogleAccountProfile {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
  connectedAt: string;
  lastSyncAt?: string;
  autoSyncBills?: boolean;
  reminderMinutes?: number;
}

// ----------------- ACCOUNT PROFILE PERSISTENCE ----------------- //

export const getStoredGoogleAccount = (): GoogleAccountProfile | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(GCAL_ACCOUNT_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredGoogleAccount = (profile: GoogleAccountProfile | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem(GCAL_ACCOUNT_KEY, JSON.stringify(profile));
      // Async persist to Firestore for cloud-wide persistence across devices/browsers
      const docRef = doc(db, 'google_calendar_sync', 'account_status');
      setDoc(
        docRef,
        sanitizeForFirestore({
          ...profile,
          connected: true,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      ).catch((err) => console.warn('Firestore gcal account save error:', err));
    } else {
      localStorage.removeItem(GCAL_ACCOUNT_KEY);
      const docRef = doc(db, 'google_calendar_sync', 'account_status');
      setDoc(
        docRef,
        {
          connected: false,
          disconnectedAt: new Date().toISOString(),
          email: null,
          displayName: null,
        },
        { merge: true }
      ).catch((err) => console.warn('Firestore gcal disconnect save error:', err));
    }
  } catch (e) {
    console.error('Failed to save google account persistence:', e);
  }
};

// ----------------- OAUTH TOKEN PERSISTENCE ----------------- //

export const getGoogleCalendarToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;

  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GCAL_TOKEN_KEY) || sessionStorage.getItem(GCAL_TOKEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Valid if not expired (with 120s buffer)
      if (parsed.token && parsed.expiresAt && Date.now() < parsed.expiresAt - 120000) {
        cachedAccessToken = parsed.token;
        return parsed.token;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const saveStoredGoogleToken = (token: string, expiresInSeconds: number = 3600) => {
  cachedAccessToken = token;
  if (typeof window === 'undefined') return;
  const payload = {
    token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(GCAL_TOKEN_KEY, JSON.stringify(payload));
    sessionStorage.setItem(GCAL_TOKEN_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to store gcal token in storage:', e);
  }
};

export const clearGoogleCalendarToken = () => {
  cachedAccessToken = null;
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GCAL_TOKEN_KEY);
    sessionStorage.removeItem(GCAL_TOKEN_KEY);
    localStorage.removeItem('finance_ai_gcal_token');
  } catch {}
};

// ----------------- SYNCED BILLS PERSISTENCE ----------------- //

export const getSyncedBillsMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GCAL_SYNCED_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
    const oldRaw = localStorage.getItem('finance_ai_gcal_synced_map');
    if (oldRaw) return JSON.parse(oldRaw);
    return {};
  } catch {
    return {};
  }
};

export const fetchCloudSyncedBillsMap = async (): Promise<Record<string, string>> => {
  try {
    const docRef = doc(db, 'google_calendar_sync', 'synced_bills');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cloudMap = (snap.data()?.map as Record<string, string>) || {};
      const localMap = getSyncedBillsMap();
      const merged = { ...cloudMap, ...localMap };
      if (typeof window !== 'undefined') {
        localStorage.setItem(GCAL_SYNCED_EVENTS_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching cloud synced bills map:', err);
  }
  return getSyncedBillsMap();
};

export const markBillAsSynced = (billId: string, eventLink: string) => {
  try {
    const map = getSyncedBillsMap();
    map[billId] = eventLink;
    if (typeof window !== 'undefined') {
      localStorage.setItem(GCAL_SYNCED_EVENTS_KEY, JSON.stringify(map));
    }

    // Save to Firestore
    const docRef = doc(db, 'google_calendar_sync', 'synced_bills');
    setDoc(docRef, { map, lastUpdated: new Date().toISOString() }, { merge: true }).catch((err) =>
      console.warn('Save synced bill to Firestore error:', err)
    );

    // Update last sync time on account profile
    const acc = getStoredGoogleAccount();
    if (acc) {
      acc.lastSyncAt = new Date().toISOString();
      saveStoredGoogleAccount(acc);
    }
  } catch (e) {
    console.error('Failed to save synced bill mapping:', e);
  }
};

// ----------------- AUTH STATE LISTENER ----------------- //

export const initGoogleCalendarAuth = (
  onAuthSuccess?: (user: GoogleAccountProfile, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  // Proactively check stored persistence
  const storedAccount = getStoredGoogleAccount();
  const validToken = getGoogleCalendarToken();

  if (storedAccount && onAuthSuccess) {
    onAuthSuccess(storedAccount, validToken);
  }

  // Also listen for cloud updates and Firebase Auth events
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const currentToken = getGoogleCalendarToken();
      const currentAccount = getStoredGoogleAccount();
      const profile: GoogleAccountProfile = {
        email: firebaseUser.email || currentAccount?.email || '',
        displayName: firebaseUser.displayName || currentAccount?.displayName || null,
        photoURL: firebaseUser.photoURL || currentAccount?.photoURL || null,
        uid: firebaseUser.uid,
        connectedAt: currentAccount?.connectedAt || new Date().toISOString(),
        lastSyncAt: currentAccount?.lastSyncAt,
      };
      saveStoredGoogleAccount(profile);
      if (onAuthSuccess) {
        onAuthSuccess(profile, currentToken);
      }
    } else {
      if (!isSigningIn) {
        const persisted = getStoredGoogleAccount();
        if (persisted) {
          const currentToken = getGoogleCalendarToken();
          if (onAuthSuccess) onAuthSuccess(persisted, currentToken);
        } else {
          if (onAuthFailure) onAuthFailure();
        }
      }
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{ user: GoogleAccountProfile; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Calendar');
    }

    saveStoredGoogleToken(credential.accessToken);
    const profile: GoogleAccountProfile = {
      email: result.user.email || '',
      displayName: result.user.displayName || null,
      photoURL: result.user.photoURL || null,
      uid: result.user.uid,
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    };
    saveStoredGoogleAccount(profile);

    // Initial sync of bills map from cloud
    fetchCloudSyncedBillsMap().catch(() => {});

    return { user: profile, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Calendar Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const disconnectGoogleCalendar = async () => {
  clearGoogleCalendarToken();
  saveStoredGoogleAccount(null);
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
};

export interface CalendarEventPayload {
  id?: string;
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  amount?: number;
  bankName?: string;
  reminderMinutes?: number;
}

// Fetch events from user's primary calendar
export async function fetchGoogleCalendarEvents(
  token: string, 
  timeMin?: string, 
  timeMax?: string
): Promise<{ id: string; summary: string; start: any; htmlLink?: string }[]> {
  try {
    const min = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const max = timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', min);
    url.searchParams.append('timeMax', max);
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    url.searchParams.append('maxResults', '50');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to fetch events from Google Calendar:', err);
    return [];
  }
}

// Push a financial bill or recurring expense to user's primary Google Calendar
export async function syncBillToGoogleCalendar(
  event: CalendarEventPayload, 
  token: string
): Promise<{ success: boolean; eventLink?: string; error?: string }> {
  try {
    const startDateTime = `${event.startDate}T09:00:00`;
    const endDateTime = `${event.startDate}T10:00:00`;

    const reminderMinutes = event.reminderMinutes ?? (24 * 60);

    const body = {
      summary: event.summary,
      description: `${event.description}\n\n• Aplicativo: Finance AI\n• Sincronizado automaticamente com persistência`,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: reminderMinutes },
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearGoogleCalendarToken();
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Erro ${res.status} ao conectar à API do Google Calendar`);
    }

    const data = await res.json();
    if (event.id && data.htmlLink) {
      markBillAsSynced(event.id, data.htmlLink);
    }
    return { success: true, eventLink: data.htmlLink };
  } catch (err: any) {
    console.error('Error syncing to Google Calendar:', err);
    return { success: false, error: err.message || 'Falha ao sincronizar' };
  }
}
