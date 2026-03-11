import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { safeStorage } from '@utils/safeStorage';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | 'none';

export interface BiometricCapability {
  available: boolean;
  biometryType: BiometricType;
  label: string;
  iconName: string;
}

export const BiometricService = {
  async getCapability(): Promise<BiometricCapability> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        return { available: false, biometryType: 'none', label: 'Biometrics', iconName: 'lock' };
      }
      if (biometryType === BiometryTypes.FaceID) {
        return { available: true, biometryType: 'FaceID', label: 'Face ID', iconName: 'face-recognition' };
      }
      if (biometryType === BiometryTypes.TouchID) {
        return { available: true, biometryType: 'TouchID', label: 'Touch ID', iconName: 'fingerprint' };
      }
      return { available: true, biometryType: 'Biometrics', label: 'Biometrics', iconName: 'fingerprint' };
    } catch {
      return { available: false, biometryType: 'none', label: 'Biometrics', iconName: 'lock' };
    }
  },

  async authenticate(reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: reason,
        cancelButtonText: 'Use Password',
      });
      return { success };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const val = await safeStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await safeStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },
};
