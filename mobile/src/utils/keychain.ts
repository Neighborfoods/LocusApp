import * as Keychain from 'react-native-keychain';

const SERVICE = 'locus_auth';
const KEYCHAIN_TIMEOUT_MS = 2000;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/** In-memory fallback when Keychain hangs or fails (debug: rule out keychain locks). */
let fallbackTokens: StoredTokens | null = null;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[keychain] ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/** Sanitized read: returns null on any keychain error or invalid/corrupt data. On timeout >2s, use in-memory fallback. */
export async function getTokens(): Promise<StoredTokens | null> {
  try {
    const result = await withTimeout(
      Keychain.getGenericPassword({ service: SERVICE }),
      KEYCHAIN_TIMEOUT_MS,
      'getTokens'
    );
    if (!result) return fallbackTokens;
    const accessToken = result.username;
    const refreshToken = result.password;
    if (!isNonEmptyString(accessToken) || !isNonEmptyString(refreshToken)) {
      await Keychain.resetGenericPassword({ service: SERVICE }).catch(() => {});
      return fallbackTokens;
    }
    return { accessToken, refreshToken };
  } catch (e) {
    if (__DEV__) console.warn('[keychain] getTokens failed or timed out, using in-memory fallback', e);
    await Keychain.resetGenericPassword({ service: SERVICE }).catch(() => {});
    return fallbackTokens;
  }
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (!isNonEmptyString(accessToken) || !isNonEmptyString(refreshToken)) return;
  try {
    await withTimeout(
      Keychain.setGenericPassword(accessToken, refreshToken, {
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
      KEYCHAIN_TIMEOUT_MS,
      'saveTokens'
    );
    fallbackTokens = null;
  } catch (e) {
    if (__DEV__) console.warn('[keychain] saveTokens failed or timed out, using in-memory fallback', e);
    fallbackTokens = { accessToken, refreshToken };
  }
}

/** Idempotent clear: never throws. Clears both Keychain and in-memory fallback. */
export async function clearTokens(): Promise<void> {
  fallbackTokens = null;
  try {
    await withTimeout(Keychain.resetGenericPassword({ service: SERVICE }), KEYCHAIN_TIMEOUT_MS, 'clearTokens');
  } catch {
    // Ignore: storage may already be clear or inaccessible
  }
}

const BIOMETRIC_SERVICE = `${SERVICE}.biometric`;

/** Store a token for biometric (Face ID / Touch ID) sign-in. */
export async function saveBiometricToken(token: string): Promise<void> {
  try {
    await Keychain.setGenericPassword('biometric_token', token, {
      service: BIOMETRIC_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    });
  } catch {
    // Biometric keychain may not be available on simulator or if disabled
  }
}

/** Retrieve token for biometric sign-in (prompts Face ID / Touch ID). */
export async function getBiometricToken(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: { title: 'Sign in to LOCUS' },
    });
    if (!creds || typeof creds !== 'object' || !('password' in creds)) return null;
    return creds.password;
  } catch {
    return null;
  }
}

/** Clear biometric-stored token. */
export async function clearBiometricToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
  } catch {}
}
