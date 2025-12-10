import { useState, useEffect } from "react";
import OneSignal from 'react-onesignal';
import { Bell, BellRing, Loader2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const NotificationButton = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier l'état actuel au chargement
    const checkStatus = async () => {
      try {
        // On attend un peu que OneSignal s'initialise
        // Note: Avec la version 3.4+, on accède à User.PushSubscription
        const subscribed = OneSignal.User?.PushSubscription?.optedIn;
        setIsSubscribed(!!subscribed);
        setLoading(false);
      } catch (error) {
        console.error("OneSignal pas encore prêt", error);
        setLoading(false);
      }
    };

    checkStatus();

    // 2. Écouter les changements (si l'utilisateur change les réglages du navigateur)
    const handleChange = (event: any) => {
      setIsSubscribed(event.current.optedIn);
    };

    try {
      OneSignal.User?.PushSubscription?.addEventListener("change", handleChange);
    } catch (e) {
      // Ignorer si OneSignal n'est pas encore chargé
    }

    // Nettoyage
    return () => {
      try {
        OneSignal.User?.PushSubscription?.removeEventListener("change", handleChange);
      } catch (e) {}
    };
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        // SE DÉSABONNER
        await OneSignal.User.PushSubscription.optOut();
        toast.info("Notifications désactivées.");
        setIsSubscribed(false);
      } else {
        // S'ABONNER
        // Cela va déclencher la demande native du navigateur
        await OneSignal.User.PushSubscription.optIn();
        toast.success("Notifications activées !");
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Erreur toggle OneSignal:", error);
      toast.error("Impossible de changer l'abonnement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      className={`transition-colors ${
        isSubscribed 
          ? "text-[#C41E25] bg-[#C41E25]/10 hover:bg-[#C41E25]/20" 
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
      title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications"}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5 opacity-50" />
      )}
    </Button>
  );
};