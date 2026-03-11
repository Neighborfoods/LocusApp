/**
 * BiometricService: getCapability, authenticate, isEnabled/setEnabled
 */
const mockIsSensorAvailable = jest.fn();
const mockSimplePrompt = jest.fn();

jest.mock('react-native-biometrics', () => {
  const fn = jest.fn(function (this: unknown) {
    return {
      isSensorAvailable: mockIsSensorAvailable,
      simplePrompt: mockSimplePrompt,
    };
  });
  return {
    __esModule: true,
    default: fn,
    BiometryTypes: { FaceID: 'FaceID', TouchID: 'TouchID', Biometrics: 'Biometrics' },
  };
});

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

beforeEach(() => {
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

// Require after mocks so the service gets the mocked biometrics instance
const { BiometricService } = require('../src/services/BiometricService');

describe('BiometricService', () => {
  describe('getCapability()', () => {
    it('returns FaceID capability on iOS Face ID device', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: true, biometryType: 'FaceID' });
      const cap = await BiometricService.getCapability();
      expect(cap.available).toBe(true);
      expect(cap.biometryType).toBe('FaceID');
      expect(cap.label).toBe('Face ID');
      expect(cap.iconName).toBe('face-recognition');
    });

    it('returns TouchID capability on iPhone with Touch ID', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });
      const cap = await BiometricService.getCapability();
      expect(cap.biometryType).toBe('TouchID');
      expect(cap.label).toBe('Touch ID');
      expect(cap.iconName).toBe('fingerprint');
    });

    it('returns Biometrics capability on Android', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: true, biometryType: 'Biometrics' });
      const cap = await BiometricService.getCapability();
      expect(cap.biometryType).toBe('Biometrics');
      expect(cap.iconName).toBe('fingerprint');
    });

    it('returns none when biometrics not available', async () => {
      mockIsSensorAvailable.mockResolvedValue({ available: false });
      const cap = await BiometricService.getCapability();
      expect(cap.available).toBe(false);
      expect(cap.biometryType).toBe('none');
    });

    it('handles sensor error gracefully', async () => {
      mockIsSensorAvailable.mockRejectedValue(new Error('Sensor error'));
      const cap = await BiometricService.getCapability();
      expect(cap.available).toBe(false);
    });
  });

  describe('authenticate()', () => {
    it('returns success:true on Face ID match', async () => {
      mockSimplePrompt.mockResolvedValue({ success: true });
      const result = await BiometricService.authenticate('Sign in');
      expect(result.success).toBe(true);
    });

    it('returns success:false when user cancels', async () => {
      mockSimplePrompt.mockResolvedValue({ success: false });
      const result = await BiometricService.authenticate('Sign in');
      expect(result.success).toBe(false);
    });

    it('handles authentication error gracefully', async () => {
      mockSimplePrompt.mockRejectedValue(new Error('Auth failed'));
      const result = await BiometricService.authenticate('Sign in');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('setEnabled() / isEnabled()', () => {
    it('persists enabled state to AsyncStorage', async () => {
      await BiometricService.setEnabled(true);
      expect(mockSetItem).toHaveBeenCalledWith('biometric_enabled', 'true');
    });

    it('reads enabled state from AsyncStorage', async () => {
      mockGetItem.mockResolvedValue('true');
      const enabled = await BiometricService.isEnabled();
      expect(enabled).toBe(true);
    });

    it('returns false when no value stored', async () => {
      mockGetItem.mockResolvedValue(null);
      const enabled = await BiometricService.isEnabled();
      expect(enabled).toBe(false);
    });
  });
});
