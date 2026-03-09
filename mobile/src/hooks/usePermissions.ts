import { useState, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

type PermissionKey = 'camera' | 'location' | 'notifications' | 'photos';

const PERMISSION_MAP: Record<PermissionKey, Permission> = {
  camera: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
  location: Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  notifications: Platform.OS === 'ios' ? PERMISSIONS.IOS.NOTIFICATIONS : PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  photos: Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
};

export function usePermissions() {
  const [statuses, setStatuses] = useState<Partial<Record<PermissionKey, string>>>({});

  const requestPermission = useCallback(async (key: PermissionKey): Promise<boolean> => {
    const permission = PERMISSION_MAP[key];
    const status = await request(permission);

    setStatuses((prev) => ({ ...prev, [key]: status }));

    if (status === RESULTS.BLOCKED) {
      Alert.alert(
        'Permission Required',
        `Please enable ${key} permission in Settings to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return status === RESULTS.GRANTED;
  }, []);

  const checkPermission = useCallback(async (key: PermissionKey): Promise<boolean> => {
    const permission = PERMISSION_MAP[key];
    const status = await check(permission);
    setStatuses((prev) => ({ ...prev, [key]: status }));
    return status === RESULTS.GRANTED;
  }, []);

  return { statuses, requestPermission, checkPermission };
}
