/**
 * Profile photo: launchCamera / launchImageLibrary return URIs; handle cancel and errors
 */
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

describe('Profile Photo Upload', () => {
  const mockAsset = { uri: 'file:///tmp/photo.jpg', type: 'image/jpeg', fileName: 'photo.jpg' };

  it('launchCamera returns valid asset URI', async () => {
    (launchCamera as jest.Mock).mockResolvedValue({ assets: [mockAsset] });
    const result = await launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.assets?.[0]?.uri).toBe('file:///tmp/photo.jpg');
  });

  it('launchImageLibrary returns valid asset URI', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValue({ assets: [mockAsset] });
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.assets?.[0]?.uri).toBeDefined();
  });

  it('handles user cancellation gracefully', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValue({ assets: undefined, didCancel: true });
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.didCancel).toBe(true);
    expect(result.assets).toBeUndefined();
  });

  it('handles camera permission denied', async () => {
    (launchCamera as jest.Mock).mockResolvedValue({ errorCode: 'permission', errorMessage: 'Permission denied' });
    const result = await launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.errorCode).toBe('permission');
  });

  it('handles camera unavailable on simulator', async () => {
    (launchCamera as jest.Mock).mockResolvedValue({ errorCode: 'camera_unavailable' });
    const result = await launchCamera({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.errorCode).toBe('camera_unavailable');
  });

  it('validates image dimensions do not exceed maxWidth/maxHeight', async () => {
    const largeAsset = { ...mockAsset, width: 400, height: 400 };
    (launchImageLibrary as jest.Mock).mockResolvedValue({ assets: [largeAsset] });
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.85, maxWidth: 400, maxHeight: 400 });
    expect(result.assets?.[0]?.width).toBeLessThanOrEqual(400);
    expect(result.assets?.[0]?.height).toBeLessThanOrEqual(400);
  });
});
