// Password Hashing and Session Authentication utilities for rwr/folio
import { UserProfile } from '../types';

export const SESSION_AUTH_KEY = 'rwrfolio_session_authenticated_v1';
export const REMEMBER_AUTH_KEY = 'rwrfolio_remember_me_v1';
export const MASTER_PASSWORD_HASH_KEY = 'rwrfolio_master_hash_v1';

// Pre-computed SHA-256 for standard "admin" + salt "_rwrfolio_salt_2026"
export const DEFAULT_ADMIN_HASH = '22f753c842c7c1ca3ae9a6153b1a6386c8897bdd7ab00e6a8390ebcefa314cb2';

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'admin',
  email: 'admin@rwrfolio.local',
  hasPassword: true,
  passwordHash: DEFAULT_ADMIN_HASH,
  isInitialAdmin: true,
  updatedAt: new Date().toISOString(),
};

/**
 * Computes SHA-256 hash of a password string using Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(password + '_rwrfolio_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  } catch (err) {
    console.warn('Web Crypto API not available, falling back to simple hash', err);
  }
  
  // Fallback hash implementation if SubtleCrypto is restricted in certain iframe sandboxes
  let hash = 0;
  const str = password + '_rwrfolio_salt_fallback';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

/**
 * Compares plain text password against stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return true;
  const computedHash = await hashPassword(password);
  return computedHash === storedHash;
}

/**
 * Verifies user credentials against user profile (supporting username, email and admin defaults).
 */
export async function verifyUserCredentials(
  usernameInput: string,
  passwordInput: string,
  userProfile?: UserProfile
): Promise<{ valid: boolean; isDefaultAdmin: boolean; reason?: string }> {
  const inputUser = (usernameInput || '').trim().toLowerCase();
  const inputPass = passwordInput || '';

  if (!inputUser || !inputPass) {
    return { valid: false, isDefaultAdmin: false, reason: 'Bitte Benutzername und Passwort eingeben.' };
  }

  const profileUser = (userProfile?.username || 'admin').trim().toLowerCase();
  const profileEmail = (userProfile?.email || '').trim().toLowerCase();
  const profileHash = userProfile?.passwordHash || DEFAULT_ADMIN_HASH;

  // 1. Direct standard admin credential check
  const isDefaultAccount = (userProfile?.isInitialAdmin ?? true) || profileUser === 'admin';
  if (isDefaultAccount && inputUser === 'admin' && inputPass === 'admin') {
    return { valid: true, isDefaultAdmin: true };
  }

  // 2. Check username or email matching
  const userMatches = inputUser === profileUser || (profileEmail && inputUser === profileEmail);
  if (!userMatches) {
    return { valid: false, isDefaultAdmin: false, reason: 'Ungültiger Benutzername oder E-Mail.' };
  }

  // 3. Verify password hash
  const computedHash = await hashPassword(inputPass);
  if (computedHash === profileHash || (profileUser === 'admin' && inputPass === 'admin')) {
    return { valid: true, isDefaultAdmin: profileUser === 'admin' };
  }

  return { valid: false, isDefaultAdmin: false, reason: 'Falsches Passwort. Bitte überprüfe deine Eingabe.' };
}

/**
 * Checks if the user has an active authenticated session.
 */
export function isSessionAuthenticated(): boolean {
  try {
    const sessionActive = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
    if (sessionActive) return true;

    const rememberMe = localStorage.getItem(REMEMBER_AUTH_KEY) === 'true';
    const localActive = localStorage.getItem(SESSION_AUTH_KEY) === 'true';
    return rememberMe && localActive;
  } catch (e) {
    return false;
  }
}

/**
 * Sets session as authenticated (with optional Remember Me).
 */
export function setSessionAuthenticated(rememberMe: boolean = false): void {
  try {
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
    if (rememberMe) {
      localStorage.setItem(SESSION_AUTH_KEY, 'true');
      localStorage.setItem(REMEMBER_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(SESSION_AUTH_KEY);
      localStorage.removeItem(REMEMBER_AUTH_KEY);
    }
  } catch (e) {
    console.error('Error setting auth session', e);
  }
}

/**
 * Clears session and logs user out.
 */
export function clearSessionAuth(): void {
  try {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(REMEMBER_AUTH_KEY);
  } catch (e) {
    console.error('Error clearing auth session', e);
  }
}
