import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface House {
  id: string;
  owner_name: string;
  street: string;
  city: string;
  created_at: string;
}

export const useHouseNotifications = () => {
  const [newHousesCount, setNewHousesCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<string>(
    localStorage.getItem("lastHouseCheck") || new Date().toISOString()
  );

  useEffect(() => {
    // Écoute en temps réel des nouvelles maisons
    const channel = supabase
      .channel('houses-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'houses'
        },
        (payload) => {
          const newHouse = payload.new as House;
          toast.info(`Nouvelle maison enregistrée`, {
            description: `${newHouse.owner_name} - ${newHouse.street}, ${newHouse.city}`,
            duration: 5000
          });
          setNewHousesCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = () => {
    const now = new Date().toISOString();
    setLastChecked(now);
    setNewHousesCount(0);
    localStorage.setItem("lastHouseCheck", now);
  };

  return { newHousesCount, markAsRead };
};
