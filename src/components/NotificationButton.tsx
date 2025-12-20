import { useState, useEffect } from "react";
import OneSignal from 'react-onesignal';
import { Bell, BellRing, Loader2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const NotificationButton = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initStatus = async () => {
      try {
        // On attend que OneSignal soit prêt (délai de sécurité)
        // @ts-ignore (Ignore l'erreur TypeScript si la version de la librairie est ancienne)
        if (!OneSignal.User) {
            console.log("OneSignal pas encore chargé, attente...");
            return; // On réessaiera ou l'event listener prendra le relais
        }

        // Vérification de l'état actuel
        // @ts-ignore
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        if (mounted) {
            setIsSubscribed(!!optedIn);
            setLoading(false);
        }
      } catch (e) {
        console.error("Erreur chargement statut OneSignal", e);
        if (mounted) setLoading(false);
      }
    };

    // On lance la vérification
    // Petit délai pour laisser le temps au script sw.ts de s'initialiser
    setTimeout(initStatus, 1000);

    // Écouteur de changement (si l'utilisateur change les paramètres du navigateur)
    const handleChange = (event: any) => {
      console.log("Changement statut notif:", event);
      setIsSubscribed(event.current.optedIn);
    };

    try {
      // @ts-ignore
      OneSignal.User?.PushSubscription?.addEventListener("change", handleChange);
    } catch (e) {
      console.log("Listener pas encore prêt");
    }

    return () => {
      mounted = false;
      try {
        // @ts-ignore
        OneSignal.User?.PushSubscription?.removeEventListener("change", handleChange);
      } catch (e) {}
    };
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        // SE DÉSABONNER
        console.log("Désabonnement...");
        // @ts-ignore
        await OneSignal.User.PushSubscription.optOut();
        toast.info("Notifications désactivées.");
        setIsSubscribed(false);
      } else {
        // S'ABONNER
        console.log("Demande d'abonnement...");
        // On utilise Slidedown pour forcer l'affichage de la demande native proprement
        // @ts-ignore
        await OneSignal.Slidedown.promptPush(); 
        // Note: L'état isSubscribed sera mis à jour automatiquement par le listener "change"
        toast.success("Demande envoyée ! Acceptez les notifications.");
      }
    } catch (error) {
      console.error("Erreur toggle OneSignal:", error);
      toast.error("Vérifiez les paramètres de votre navigateur.");
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
      className={`transition-all duration-300 ${
        isSubscribed 
          ? "text-[#C41E25] bg-[#C41E25]/10 hover:bg-[#C41E25]/20 ring-1 ring-[#C41E25]/50" 
          : "text-gray-400 hover:text-white hover:bg-white/10"
      }`}
      title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications"}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5 opacity-70" />
      )}
    </Button>
  );
};