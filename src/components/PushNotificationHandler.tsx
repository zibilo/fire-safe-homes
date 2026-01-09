import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Composant invisible qui initialise les notifications push Android
 * À monter une seule fois à la racine de l'application
 */
export const PushNotificationHandler = () => {
  const { isSupported, isRegistered, token, loading } = usePushNotifications();

  useEffect(() => {
    if (!loading && isSupported) {
      if (isRegistered && token) {
        console.log('✅ Notifications push Android activées');
      } else {
        console.log('⏳ En attente d\'enregistrement push...');
      }
    } else if (!loading && !isSupported) {
      console.log('ℹ️ Notifications push non supportées (plateforme web)');
    }
  }, [isSupported, isRegistered, token, loading]);

  // Ce composant ne rend rien visuellement
  return null;
};
