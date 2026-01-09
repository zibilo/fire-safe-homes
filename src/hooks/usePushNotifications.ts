import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  loading: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      setState(prev => ({ ...prev, isSupported: false, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));
    
    const initPushNotifications = async () => {
      try {
        // Vérifier les permissions
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Permissions push refusées');
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Enregistrer pour les notifications push
        await PushNotifications.register();
        
      } catch (error) {
        console.error('Erreur init push:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    // Listeners
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Token FCM reçu:', token.value);
      setState(prev => ({ ...prev, token: token.value, isRegistered: true, loading: false }));
      
      // Sauvegarder le token dans Supabase
      try {
        const { error } = await supabase
          .from('web_push_tokens')
          .upsert(
            { 
              id: token.value.substring(0, 36), // Use first 36 chars as UUID-like ID
              token: { fcm_token: token.value, platform: 'android' } 
            },
            { onConflict: 'id' }
          );
          
        if (error) {
          console.error('Erreur sauvegarde token:', error);
        } else {
          console.log('Token FCM sauvegardé avec succès');
        }
      } catch (e) {
        console.error('Erreur sauvegarde token:', e);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Erreur enregistrement push:', error);
      setState(prev => ({ ...prev, loading: false }));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Notification reçue:', notification);
      toast.info(notification.title || 'Nouvelle notification', {
        description: notification.body,
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Action notification:', action);
      // Naviguer vers le blog si c'est une notification de nouvel article
      const data = action.notification.data;
      if (data?.slug) {
        window.location.href = `/blog/${data.slug}`;
      }
    });

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const requestPermission = async () => {
    if (!state.isSupported) return false;
    
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur demande permission:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
  };
};
