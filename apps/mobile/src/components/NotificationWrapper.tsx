import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/user.service';

export const NotificationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { expoPushToken } = usePushNotifications();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && expoPushToken) {
      userService.registerPushToken(expoPushToken).catch((err) => {
        console.error('Failed to register push token', err);
      });
    }
  }, [isAuthenticated, expoPushToken]);

  return <>{children}</>;
};
